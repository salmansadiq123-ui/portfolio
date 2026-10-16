import { launchBrowser } from "./browser";
import { chatJson, llmConfigured } from "./llm";
import type { Finding, RunResult, Severity } from "./types";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const ORDER: Severity[] = ["critical", "major", "minor", "suggestion"];
const WEIGHT: Record<Severity, number> = { critical: 15, major: 8, minor: 3, suggestion: 0 };

export function score(findings: Finding[]) {
  return Math.max(0, 100 - findings.reduce((s, f) => s + WEIGHT[f.severity], 0));
}

/** Keeps the report readable when both runs flag the same thing. */
function merge(runs: RunResult[]): (Finding & { viewports: string[] })[] {
  const map = new Map<string, Finding & { viewports: string[] }>();
  for (const r of runs)
    for (const f of r.findings) {
      const key = `${f.source}:${f.title.toLowerCase()}`;
      const hit = map.get(key);
      if (hit) {
        if (!hit.viewports.includes(f.viewport)) hit.viewports.push(f.viewport);
        hit.shot ??= f.shot;
      } else map.set(key, { ...f, viewports: [f.viewport] });
    }
  return [...map.values()].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
}

async function summarise(url: string, findings: Finding[], runs: RunResult[]): Promise<string> {
  const counts = ORDER.map((s) => `${findings.filter((f) => f.severity === s).length} ${s}`).join(", ");
  const fallback = findings.length
    ? `Automated QA of ${url} found ${counts}. Start with the critical and major issues below; each one lists where it happened and why it matters.`
    : `Automated QA of ${url} found no issues in the flows that were exercised. That's a good sign, but it is not a substitute for a full manual test plan.`;
  if (!llmConfigured()) return fallback;
  try {
    const out = await chatJson<{ summary?: string }>(
      [
        { role: "system", content: 'You write the executive summary of a QA report for a client. 3-5 sentences, plain English, no markdown. Lead with overall quality, then the most important problems and what to fix first. Reply as JSON: {"summary":"..."}' },
        {
          role: "user",
          content: `Site: ${url}\nIssue counts: ${counts}\nSteps tested: ${runs.map((r) => `${r.viewport}: ${r.steps.map((s) => s.action).join(" → ")}`).join("\n")}\nFindings:\n${findings.slice(0, 30).map((f) => `- [${f.severity}] ${f.title} (${f.viewport})`).join("\n")}`,
        },
      ],
      { maxTokens: 500, deadline: Date.now() + 20000 },
    );
    return out.summary?.trim() || fallback;
  } catch {
    return fallback;
  }
}

const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const cleanShot = (s: unknown) => (typeof s === "string" && s.length < 1_500_000 && B64.test(s) ? s : undefined);

export async function buildReportPdf(input: RunResult[]): Promise<Buffer> {
  // Results come back from the browser, so only trust well-formed base64 screenshots.
  const runs = input.map((r) => ({
    ...r,
    viewport: r.viewport === "mobile" ? "mobile" : "desktop",
    firstShot: cleanShot(r.firstShot),
    lastShot: undefined,
    findings: r.findings.map((f) => ({ ...f, viewport: f.viewport === "mobile" ? "mobile" : "desktop", severity: ORDER.includes(f.severity) ? f.severity : "minor", shot: cleanShot(f.shot) })),
  })) as RunResult[];
  const url = runs[0]?.url ?? "";
  const findings = merge(runs);
  const total = score(findings);
  const summary = await summarise(url, findings, runs);
  const html = renderHtml(url, runs, findings, total, summary);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    // The report is self-contained; never let it fetch anything.
    await page.setRequestInterception(true);
    page.on("request", (r) => void (r.url().startsWith("data:") || r.url() === "about:blank" ? r.continue() : r.abort()));
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "16mm", left: "13mm", right: "13mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font:8px Helvetica,Arial,sans-serif;color:#8a8378;padding:0 13mm;display:flex;justify-content:space-between"><span>QA report · ${esc(new URL(url).hostname)} · ${findings.length} findings</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}

function renderHtml(url: string, runs: RunResult[], findings: (Finding & { viewports: string[] })[], total: number, summary: string) {
  const date = new Date(runs[0]?.startedAt ?? Date.now());
  const counts = Object.fromEntries(ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length])) as Record<Severity, number>;
  const verdict = total >= 85 ? "Good" : total >= 60 ? "Needs work" : "At risk";

  const findingHtml = findings
    .map(
      (f, i) => `
    <div class="finding">
      <div class="finding__head">
        <span class="sev sev--${f.severity}">${f.severity}</span>
        <h3>${i + 1}. ${esc(f.title)}</h3>
      </div>
      <div class="finding__meta">${esc(f.category)} · ${f.viewports.join(" + ")} · ${f.source === "ai" ? "found by AI tester" : "automated check"}${f.url ? ` · ${esc(f.url)}` : ""}</div>
      ${f.detail ? `<pre>${esc(f.detail)}</pre>` : ""}
      ${f.shot ? `<img class="shot shot--${f.viewport}" src="data:image/jpeg;base64,${f.shot}" />` : ""}
    </div>`,
    )
    .join("");

  const runHtml = runs
    .map((r) => {
      const c = r.checks;
      const p = c.performance;
      const row = (k: string, v: unknown) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`;
      return `
    <section class="run">
      <h2>${r.viewport === "mobile" ? "Mobile — 390×844, touch" : "Desktop — 1366×768"}</h2>
      <div class="run__grid run__grid--${r.viewport}">
        <div>
          ${r.firstShot ? `<img class="shot shot--${r.viewport}" src="data:image/jpeg;base64,${r.firstShot}" />` : ""}
        </div>
        <div>
          <table>
            ${row("Duration", `${Math.round(r.durationMs / 1000)} s · ${r.mode === "ai" ? "AI tester" : "scripted walkthrough"}`)}
            ${p ? row("Load time", `${(p.loadMs / 1000).toFixed(2)} s (DOM ready ${(p.domContentLoadedMs / 1000).toFixed(2)} s)`) : ""}
            ${p ? row("Server response", `${p.ttfbMs} ms`) : ""}
            ${p ? row("Page weight", `${(p.transferKb / 1024).toFixed(2)} MB · ${p.requests} requests`) : ""}
            ${c.meta ? row("Title", c.meta.title || "—") : ""}
            ${c.meta ? row("Meta description", c.meta.description || "missing") : ""}
            ${c.layout ? row("Layout", `${c.layout.horizontalOverflow ? "overflows sideways" : "no overflow"} · ${c.layout.brokenImages} broken images · ${c.layout.imagesMissingAlt} images without alt`) : ""}
            ${row("Accessibility (axe)", c.a11y ? `${c.a11y.length} rule violation(s)` : "not run")}
            ${row("Console errors", c.console.length + c.pageErrors.length)}
            ${row("Failed requests", c.network.length)}
            ${c.links ? row("Broken links", `${c.links.length} of the first 20 checked`) : ""}
          </table>
          ${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}
        </div>
      </div>
      <h3 class="steps__h">Test steps</h3>
      <ol class="steps">
        ${r.steps.map((s) => `<li class="${s.ok ? "" : "fail"}"><span>${esc(s.action)}</span>${s.error ? `<em>${esc(s.error)}</em>` : ""}</li>`).join("")}
      </ol>
    </section>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 10pt/1.45 Helvetica, Arial, sans-serif; color: #141210; }
  h1, h2, h3 { margin: 0; letter-spacing: -0.01em; }
  .cover { border-bottom: 2px solid #141210; padding-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
  .kicker { font: 600 8pt/1 Helvetica, Arial; letter-spacing: .16em; text-transform: uppercase; color: #e8401a; }
  .cover h1 { font-size: 24pt; margin-top: 8px; word-break: break-all; }
  .cover .sub { color: #57524a; margin-top: 6px; }
  .score { text-align: right; }
  .score b { font-size: 34pt; line-height: 1; display: block; }
  .score span { color: #57524a; font-size: 9pt; }
  .counts { display: flex; gap: 8px; margin: 16px 0; }
  .counts div { flex: 1; border: 1px solid #e2dccf; border-radius: 8px; padding: 10px 12px; }
  .counts b { font-size: 18pt; display: block; }
  .counts span { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: #57524a; }
  .summary { background: #f6f2ea; border-radius: 8px; padding: 12px 14px; font-size: 10.5pt; }
  h2.section { font-size: 13pt; margin: 22px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2dccf; }
  .finding { border: 1px solid #e2dccf; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; break-inside: avoid; }
  .finding__head { display: flex; gap: 10px; align-items: baseline; }
  .finding h3 { font-size: 10.5pt; }
  .finding__meta { color: #8a8378; font-size: 8pt; margin: 3px 0 0; word-break: break-all; }
  pre { white-space: pre-wrap; word-break: break-word; font: 8.5pt/1.45 Menlo, Consolas, monospace; background: #faf8f3; padding: 8px; border-radius: 6px; margin: 8px 0 0; color: #3c3833; }
  .sev { font: 700 7pt/1 Helvetica, Arial; text-transform: uppercase; letter-spacing: .1em; padding: 4px 7px; border-radius: 99px; color: #fff; flex: none; }
  .sev--critical { background: #b42318; } .sev--major { background: #e8401a; } .sev--minor { background: #b7791f; } .sev--suggestion { background: #57524a; }
  .shot { display: block; margin-top: 8px; border: 1px solid #e2dccf; border-radius: 6px; }
  .shot--mobile { width: 46mm; } .shot--desktop { width: 120mm; }
  .run { break-before: page; }
  .run h2 { font-size: 14pt; margin-bottom: 10px; }
  .run__grid { display: flex; gap: 14px; align-items: flex-start; }
  .run__grid > div:last-child { flex: 1; }
  .run__grid--desktop { display: block; }
  .run__grid--desktop table { margin-top: 12px; }
  .run__grid--desktop .shot--desktop { width: 100%; }
  table { width: 100%; border-collapse: collapse; font-size: 8.8pt; }
  th { text-align: left; color: #57524a; font-weight: 600; width: 34%; vertical-align: top; }
  th, td { padding: 4px 6px 4px 0; border-bottom: 1px solid #efe9de; word-break: break-word; }
  .note { font-size: 8.5pt; color: #8a5a00; background: #fff6e0; padding: 6px 8px; border-radius: 6px; }
  .steps__h { font-size: 10.5pt; margin: 14px 0 6px; }
  .steps { margin: 0; padding-left: 18px; font-size: 8.8pt; }
  .steps li { margin-bottom: 3px; }
  .steps li.fail span { color: #b42318; }
  .steps em { display: block; color: #8a8378; font-style: normal; font-size: 8pt; }
  .method { font-size: 8.5pt; color: #57524a; }
  .method-wrap { break-inside: avoid; }
  h2.section, .steps__h { break-after: avoid; }
  </style></head><body>
  <div class="cover">
    <div>
      <div class="kicker">Automated QA report</div>
      <h1>${esc(new URL(url).hostname)}</h1>
      <div class="sub">${esc(url)}<br>${date.toUTCString()} · ${runs.map((r) => r.viewport).join(" + ")}</div>
    </div>
    <div class="score"><b>${total}</b><span>Quality score · ${verdict}</span></div>
  </div>
  <div class="counts">
    ${ORDER.map((s) => `<div><b>${counts[s]}</b><span>${s}</span></div>`).join("")}
  </div>
  <div class="summary">${esc(summary)}</div>

  <h2 class="section">Findings</h2>
  ${findingHtml || "<p>No issues found in the flows that were exercised.</p>"}

  ${runHtml}

  <div class="method-wrap"><h2 class="section">Method &amp; limits</h2>
  <p class="method">Tested in headless Chromium with mobile (iPhone-sized, touch) and desktop emulation — not real Safari or real devices. An AI tester (vision LLM) chose the flows from screenshots and page structure; automated checks covered performance timing, accessibility (axe-core, WCAG 2 A/AA), SEO meta tags, console and network errors, links and layout. Credentials were used only for this run, never stored and never sent to the AI model. Treat AI findings as leads to confirm, and use this report alongside a manual test plan.</p></div>
  </body></html>`;
}
