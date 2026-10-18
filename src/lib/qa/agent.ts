import type { ElementHandle, Page } from "puppeteer-core";
import { launchBrowser, preparePage, settle, sleep, snap } from "./browser";
import { checkLinks, checksToFindings, inspectLanding, watchPage } from "./checks";
import { chatJson, llmConfigured, type ChatMessage } from "./llm";
import type { Finding, Pointer, RunEvent, RunInput, RunResult, Step } from "./types";

const TIME_BUDGET = Number(process.env.QA_TIME_BUDGET_MS || 250_000); // Vercel Hobby functions stop at 300 s
const MAX_TURNS = Number(process.env.QA_MAX_TURNS || 12);
const MAX_SHOTS = 8; // screenshots kept per run for the PDF

type Action =
  | { type: "click"; id: number }
  | { type: "type"; id: number; text: string; submit?: boolean }
  | { type: "select"; id: number; value: string }
  | { type: "scroll"; direction?: "down" | "up" }
  | { type: "goto"; url: string }
  | { type: "back" }
  | { type: "press"; key: string }
  | { type: "wait" };

type Turn = {
  thought?: string;
  actions?: Action[];
  findings?: { severity?: string; category?: string; title?: string; detail?: string }[];
  done?: boolean;
};

type El = { id: number; tag: string; type?: string; role?: string; text: string; href?: string; inView: boolean };

/** Tags visible interactive elements with data-qa-id and returns a compact list for the LLM. */
async function listElements(page: Page): Promise<El[]> {
  return page.evaluate(() => {
    document.querySelectorAll("[data-qa-id]").forEach((e) => e.removeAttribute("data-qa-id"));
    const sel = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=switch], [onclick]";
    const out: El[] = [];
    let id = 0;
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || s.visibility === "hidden" || s.display === "none" || s.opacity === "0") continue;
      const input = el as HTMLInputElement;
      const isSecret = input.type === "password";
      const label =
        el.getAttribute("aria-label") || input.placeholder || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) ||
        el.innerText || input.name || el.getAttribute("title") || (el.querySelector("img") as HTMLImageElement | null)?.alt || "";
      const value = !isSecret && input.value && el.tagName !== "BUTTON" ? ` [value: ${String(input.value).slice(0, 40)}]` : isSecret && input.value ? " [filled]" : "";
      el.setAttribute("data-qa-id", String(id));
      out.push({
        id,
        tag: el.tagName.toLowerCase(),
        type: input.type || undefined,
        role: el.getAttribute("role") || undefined,
        text: (label.replace(/\s+/g, " ").trim().slice(0, 70) + value).trim(),
        href: (el as HTMLAnchorElement).href ? new URL((el as HTMLAnchorElement).href).pathname : undefined,
        inView: r.bottom > 0 && r.top < innerHeight,
      });
      if (++id >= 90) break;
    }
    return out;
  });
}

/** Status/error/toast messages anywhere on the page, flagged when they're outside the screenshot. */
async function pageMessages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const sel =
      "[role=alert], [role=status], [aria-live], .error, .alert, .toast, .notice, .invalid-feedback, .help-block, [class*=error i], [class*=alert i], [class*=toast i], [id*=error i]";
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const text = el.innerText?.replace(/\s+/g, " ").trim();
      if (!text || text.length > 200 || out.some((o) => o.includes(text))) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || s.visibility === "hidden" || s.display === "none") continue;
      const where = r.top >= innerHeight ? " (below the visible screen)" : r.bottom <= 0 ? " (above the visible screen)" : "";
      out.push(`"${text}"${where}`);
      if (out.length >= 8) break;
    }
    return out;
  });
}

const fmtEl = (e: El) =>
  `[${e.id}] ${e.tag}${e.type && e.tag === "input" ? `:${e.type}` : ""}${e.role ? ` role=${e.role}` : ""} "${e.text}"${e.href ? ` -> ${e.href}` : ""}${e.inView ? "" : " (offscreen)"}`;

const describe = (a: Action, els: El[]) => {
  const el = "id" in a ? els.find((e) => e.id === a.id) : undefined;
  const name = el ? `"${el.text || el.tag}"` : "";
  switch (a.type) {
    case "click": return `Tap ${name}`;
    case "type": {
      const what = /\{\{password\}\}/.test(a.text) ? "the test password" : /\{\{username\}\}/.test(a.text) ? "the test username" : `"${a.text.slice(0, 40)}"`;
      return `Type ${what} into ${name}${a.submit ? " and submit" : ""}`;
    }
    case "select": return `Choose "${a.value}" in ${name}`;
    case "scroll": return `Scroll ${a.direction ?? "down"}`;
    case "goto": return `Open ${a.url}`;
    case "back": return "Go back";
    case "press": return `Press ${a.key}`;
    default: return "Wait";
  }
};

type Aim = (p: Pointer) => Promise<unknown>;

/** Scrolls the element into view and returns its centre as a viewport percentage, for the live cursor. */
async function pointAt(page: Page, el: ElementHandle | null, kind: Pointer["kind"]): Promise<Pointer> {
  // Measured in the page's own layout viewport (what the screenshot shows), centring off-screen targets first.
  const pos = await el
    ?.evaluate((e) => {
      let b = e.getBoundingClientRect();
      if (b.top < 0 || b.bottom > innerHeight || b.left < 0 || b.right > innerWidth) {
        e.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
        b = e.getBoundingClientRect();
      }
      return { x: ((b.left + b.width / 2) / innerWidth) * 100, y: ((b.top + b.height / 2) / innerHeight) * 100 };
    })
    .catch(() => null);
  if (!pos) return { x: 50, y: 70, kind };
  await sleep(120); // let the scroll paint before the screenshot
  const clamp = (n: number) => Math.max(1, Math.min(99, n));
  return { x: clamp(pos.x), y: clamp(pos.y), kind };
}

async function perform(page: Page, a: Action, input: RunInput, origin: string, aim: Aim) {
  const fill = (t: string) => t.replaceAll("{{username}}", input.username ?? "").replaceAll("{{password}}", input.password ?? "");
  const el = "id" in a ? await page.$(`[data-qa-id="${a.id}"]`) : null;
  if ("id" in a && !el) throw new Error(`Element ${a.id} is no longer on the page`);
  // Show where the tester is about to act before doing it.
  if (a.type === "click" || a.type === "select") await aim(await pointAt(page, el, "click"));
  else if (a.type === "type") await aim(await pointAt(page, el, "type"));
  else if (a.type === "scroll") await aim({ x: 50, y: 70, kind: "scroll" });
  switch (a.type) {
    case "click":
      await el!.click();
      break;
    case "type":
      await el!.click({ count: 3 }).catch(() => {});
      await el!.evaluate((e) => { if ("value" in e) (e as HTMLInputElement).value = ""; });
      await el!.type(fill(a.text), { delay: 15 });
      if (a.submit) await page.keyboard.press("Enter");
      break;
    case "select":
      await el!.select(a.value);
      break;
    case "scroll":
      await page.evaluate((d) => window.scrollBy({ top: (d === "up" ? -0.8 : 0.8) * innerHeight }), a.direction);
      break;
    case "goto": {
      const target = new URL(a.url, page.url());
      if (target.origin !== origin) throw new Error("Stayed on the site under test (external link skipped)");
      await page.goto(target.href, { waitUntil: "domcontentloaded" });
      break;
    }
    case "back":
      await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
      break;
    case "press":
      await page.keyboard.press(a.key as Parameters<Page["keyboard"]["press"]>[0]);
      break;
  }
  await settle(page);
  const now = new URL(page.url());
  if (now.origin !== origin) {
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => page.goto(origin, { waitUntil: "domcontentloaded" }));
    await settle(page);
    throw new Error(`Leads off-site to ${now.hostname} — went back`);
  }
}

const SYSTEM = (input: RunInput) => `You are a senior QA engineer testing a website in a real ${input.viewport === "mobile" ? "mobile phone (390x844, touch)" : "desktop browser (1366x768)"}.
Each turn you get a screenshot, the current URL and a numbered list of interactive elements. Decide the next 1-3 actions to test the site's real user flows, and report bugs you can SEE.

Goal: ${input.instructions?.trim() || "Explore the main user journeys like a real user: navigation, key pages, search, forms and any core feature."}
${input.username ? 'Test credentials exist. To log in, type the literal placeholders {{username}} and {{password}} — never invent credentials. Log in early if a login is available.' : "No credentials were given; test the public parts of the site."}

Rules:
- Use only element ids from the list. Prefer elements that are in view; scroll to reveal more.
- Stay on the same site. Never do destructive or real-world actions (deleting data, payments, placing orders, sending messages/invites to real people, changing the password) unless the goal explicitly asks for it.
- A finding needs visible evidence: errors, broken layout, overlapping/cut-off text, dead buttons, wrong content, confusing UX, failed login, missing feedback after submit. Don't report things you can't see. Don't repeat earlier findings.
- The screenshot only shows the visible screen. Before saying a message or element is missing, check "Messages on the page" and the element list (off-screen items are marked). If it exists but is off-screen, that's at most a minor usability issue (e.g. "error appears below the fold on mobile"), not a missing feature.
- Severity: critical = blocks a core flow; major = feature broken or badly degraded; minor = cosmetic/annoying; suggestion = improvement idea.
- Set "done": true when the goal is covered or you are stuck.

Reply with JSON only:
{"thought":"short reasoning","actions":[{"type":"click","id":3}|{"type":"type","id":5,"text":"{{username}}","submit":false}|{"type":"select","id":7,"value":"..."}|{"type":"scroll","direction":"down"}|{"type":"goto","url":"/path"}|{"type":"back"}|{"type":"press","key":"Enter"}],"findings":[{"severity":"major","category":"functional|ui|content|usability|accessibility|performance","title":"...","detail":"what happened, where, expected vs actual"}],"done":false}`;

const SEVERITIES = ["critical", "major", "minor", "suggestion"];
const CATEGORIES = ["functional", "ui", "content", "usability", "accessibility", "performance", "seo", "security"];

/** Runs one viewport: load, automated checks, then the AI (or scripted) walkthrough. */
export async function runQa(input: RunInput, emit: (e: RunEvent) => void): Promise<RunResult> {
  const started = Date.now();
  const deadline = started + TIME_BUDGET;
  const origin = new URL(input.url).origin;
  const steps: Step[] = [];
  const findings: Finding[] = [];
  let shotsKept = 0;
  const result: RunResult = {
    viewport: input.viewport, url: input.url, startedAt: new Date(started).toISOString(), durationMs: 0,
    mode: llmConfigured() ? "ai" : "auto", steps, findings, checks: { console: [], pageErrors: [], network: [] },
  };

  emit({ type: "status", message: "Starting browser…" });
  const browser = await launchBrowser();
  try {
    const page = await preparePage(browser, input.viewport);
    const checks = watchPage(page, origin);
    result.checks = checks;
    page.on("dialog", (d) => {
      steps.push({ n: steps.length + 1, action: `Browser dialog: "${d.message().slice(0, 80)}" (dismissed)`, url: page.url(), ok: true });
      void d.dismiss().catch(() => {});
    });
    page.on("popup", (p) => void p?.close().catch(() => {}));

    const frame = async (pointer?: Pointer) => {
      const shot = await snap(page);
      emit({ type: "frame", shot, url: page.url(), pointer });
      return shot;
    };
    const addFinding = (f: Finding, shot?: string) => {
      if (shot && shotsKept < MAX_SHOTS) {
        f.shot = shot;
        shotsKept++;
      }
      findings.push(f);
      const { shot: _omit, ...rest } = f;
      void _omit;
      emit({ type: "finding", finding: rest });
    };
    const record = (s: Omit<Step, "n">) => {
      const step = { n: steps.length + 1, ...s };
      steps.push(step);
      emit({ type: "step", step });
    };

    emit({ type: "status", message: `Loading ${input.url}` });
    const res = await page.goto(input.url, { waitUntil: "load", timeout: 45000 }).catch((e: Error) => e);
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 6000 }).catch(() => {});
    if (res instanceof Error || !res) {
      record({ action: `Open ${input.url}`, url: input.url, ok: false, error: res instanceof Error ? res.message : "No response" });
      addFinding({ severity: "critical", category: "functional", title: "Site failed to load", detail: res instanceof Error ? res.message : "No response", source: "check", viewport: input.viewport, url: input.url });
      return result;
    }
    record({ action: `Open ${input.url} (HTTP ${res.status()})`, url: page.url(), ok: res.ok() });
    if (!res.ok()) addFinding({ severity: "critical", category: "functional", title: `Home page returned HTTP ${res.status()}`, detail: page.url(), source: "check", viewport: input.viewport, url: input.url });
    result.firstShot = await frame();

    emit({ type: "status", message: "Running automated checks (performance, accessibility, SEO, layout)…" });
    await inspectLanding(page, input.viewport, checks);
    if (input.viewport === "desktop") {
      emit({ type: "status", message: "Checking links…" });
      await checkLinks(page, origin, checks, deadline);
    }

    const loggedIn = input.username && input.password ? await scriptedLogin(page, input, { record, frame, emit }) : false;
    if (llmConfigured()) {
      await aiLoop(page, input, origin, deadline, loggedIn, { steps, record, addFinding, frame, emit }).catch(async (e: Error) => {
        result.note = `AI tester stopped early (${e.message}); finished with the scripted walkthrough.`;
        emit({ type: "status", message: result.note });
        await scriptedExplore(page, origin, deadline, { record, frame, emit });
      });
    } else {
      result.note = "No LLM_API_KEY set — ran the scripted walkthrough instead of the AI tester.";
      await scriptedExplore(page, origin, deadline, { record, frame, emit });
    }

    for (const f of checksToFindings(checks, input.viewport, input.url)) addFinding(f);
    result.lastShot = await snap(page, 50).catch(() => undefined);
    return result;
  } finally {
    result.durationMs = Date.now() - started;
    await browser.close().catch(() => {});
  }
}

type Ctx = {
  steps: Step[];
  record: (s: Omit<Step, "n">) => void;
  addFinding: (f: Finding, shot?: string) => void;
  frame: (pointer?: Pointer) => Promise<string>;
  emit: (e: RunEvent) => void;
};

async function aiLoop(page: Page, input: RunInput, origin: string, deadline: number, loggedIn: boolean, ctx: Ctx) {
  const history: string[] = [];
  const reported: string[] = [];
  for (let turn = 1; turn <= MAX_TURNS && Date.now() < deadline - 20000; turn++) {
    ctx.emit({ type: "status", message: `AI tester thinking (turn ${turn}/${MAX_TURNS})…` });
    const els = await listElements(page);
    const msgs = await pageMessages(page).catch(() => [] as string[]);
    const shot = await snap(page, 50);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM(input) + (loggedIn ? "\n\nThe tool has ALREADY logged in with the test account. Do not log in again unless you get logged out." : ""),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `URL: ${page.url()}\nTitle: ${await page.title()}\nTurn ${turn} of ${MAX_TURNS}.\n\nSteps so far:\n${history.slice(-10).join("\n") || "(none)"}\n\nMessages on the page: ${msgs.join("; ") || "(none)"}\n\nAlready reported: ${reported.join("; ") || "(none)"}\n\nElements:\n${els.map(fmtEl).join("\n")}`,
          },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${shot}` } },
        ],
      },
    ];
    const reply = await chatJson<Turn>(messages, { deadline: deadline - 15000 });

    for (const f of reply.findings ?? []) {
      if (!f.title) continue;
      reported.push(f.title);
      ctx.addFinding(
        {
          severity: (SEVERITIES.includes(f.severity ?? "") ? f.severity : "minor") as Finding["severity"],
          category: (CATEGORIES.includes(f.category ?? "") ? f.category : "functional") as Finding["category"],
          title: f.title.slice(0, 140),
          detail: (f.detail ?? "").slice(0, 600),
          source: "ai",
          viewport: input.viewport,
          url: page.url(),
        },
        shot,
      );
    }
    if (reply.done || !reply.actions?.length) {
      history.push(`Done: ${reply.thought ?? ""}`);
      break;
    }
    for (const a of reply.actions.slice(0, 3)) {
      const action = describe(a, els);
      const before = page.url();
      try {
        await perform(page, a, input, origin, ctx.frame);
        ctx.record({ action, url: page.url(), ok: true, thought: reply.thought });
        history.push(`OK: ${action}`);
        // A new page means the remaining planned element ids are stale — look again first.
        if (page.url() !== before) break;
      } catch (e) {
        const error = (e as Error).message.slice(0, 160);
        ctx.record({ action, url: page.url(), ok: false, error, thought: reply.thought });
        history.push(`FAILED: ${action} — ${error}`);
        break; // element ids are stale after a failure; re-read the page
      }
    }
    await ctx.frame();
  }
}

type ScriptCtx = Omit<Ctx, "steps" | "addFinding">;

/** Logs in deterministically (no AI needed): finds the password field, its username field and submit button. */
async function scriptedLogin(page: Page, input: RunInput, ctx: ScriptCtx): Promise<boolean> {
  {
    ctx.emit({ type: "status", message: "Logging in with the test account…" });
    let pw = await page.$("input[type=password]");
    if (!pw) {
      const link = await page.evaluateHandle(() =>
        [...document.querySelectorAll<HTMLElement>("a, button")].find((e) => /log ?in|sign ?in|account/i.test(e.innerText || e.getAttribute("aria-label") || "")),
      );
      const el = link.asElement();
      if (el) {
        await (el as unknown as { click: () => Promise<void> }).click().catch(() => {});
        await settle(page);
        pw = await page.$("input[type=password]");
      }
    }
    if (pw) {
      // Tag the username field and submit button that belong to the password field's form.
      await pw.evaluate((p) => {
        const scope = p.closest("form") ?? document;
        const fields = [...scope.querySelectorAll<HTMLInputElement>("input[type=email], input[type=text], input[type=tel], input:not([type])")].filter(
          (i) => i.offsetParent && i.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
        fields.at(-1)?.setAttribute("data-qa-login", "user");
        // Login screens often have no <form>: take the first visible button after the password field,
        // preferring one that says log in / sign in / submit, never a header button above it.
        const after = [...scope.querySelectorAll<HTMLElement>("button, input[type=submit], [role=button]")].filter(
          (b) => b.offsetParent && p.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
        const label = (b: HTMLElement) => b.innerText || (b as HTMLInputElement).value || b.getAttribute("aria-label") || "";
        const submit = after.find((b) => /log ?in|sign ?in|submit|continue|next/i.test(label(b))) ?? after[0];
        submit?.setAttribute("data-qa-login", "submit");
      });
      const user = await page.$('[data-qa-login="user"]');
      if (user) {
        await ctx.frame(await pointAt(page, user, "type"));
        await user.type(input.username ?? "", { delay: 15 });
      }
      await ctx.frame(await pointAt(page, pw, "type"));
      await pw.type(input.password ?? "", { delay: 15 });
      const submit = await page.$('[data-qa-login="submit"]');
      if (submit) {
        await ctx.frame(await pointAt(page, submit, "click"));
        await submit.click();
      }
      else await page.keyboard.press("Enter");
      await settle(page);
      // SPAs often redirect a moment after the API answers; give the login form time to go away.
      await page.waitForFunction(() => !document.querySelector("input[type=password]"), { timeout: 10000 }).catch(() => {});
      await settle(page);
      const stillLogin = !!(await page.$("input[type=password]"));
      ctx.record({ action: "Log in with the test credentials", url: page.url(), ok: !stillLogin, error: stillLogin ? "Still on the login form after submitting — check the credentials" : undefined });
      await ctx.frame();
      return !stillLogin;
    }
    ctx.record({ action: "Log in", url: page.url(), ok: false, error: "No login form found" });
    return false;
  }
}

/** Fallback when the AI is unavailable: visit the main nav links. */
async function scriptedExplore(page: Page, origin: string, deadline: number, ctx: ScriptCtx) {
  ctx.emit({ type: "status", message: "Exploring the main pages (scripted)…" });
  const links: string[] = await page.$$eval("header a[href], nav a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href));
  const targets = [...new Set(links.map((l) => l.split("#")[0]))].filter((l) => l.startsWith(origin) && l !== page.url()).slice(0, 6);
  for (const href of targets) {
    if (Date.now() > deadline - 15000) break;
    try {
      const r = await page.goto(href, { waitUntil: "domcontentloaded" });
      await settle(page);
      if (new URL(page.url()).origin !== origin) {
        ctx.record({ action: `Open ${new URL(href).pathname}`, url: page.url(), ok: true, error: `Redirects off-site to ${new URL(page.url()).hostname} (not tested)` });
        await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
        continue;
      }
      ctx.record({ action: `Open ${new URL(href).pathname}`, url: page.url(), ok: !!r?.ok(), error: r && !r.ok() ? `HTTP ${r.status()}` : undefined });
      await ctx.frame();
    } catch (e) {
      ctx.record({ action: `Open ${new URL(href).pathname}`, url: href, ok: false, error: (e as Error).message.slice(0, 160) });
    }
  }
}
