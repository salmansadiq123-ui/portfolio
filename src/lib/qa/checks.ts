import type { Page } from "puppeteer-core";
import axe from "axe-core";
import type { Checks, Finding, Viewport } from "./types";

const MAX_LIST = 25;
const push = <T,>(list: T[], item: T) => list.length < MAX_LIST && list.push(item);

/** Hooks page events for the whole session: console errors, uncaught exceptions, failed requests. */
export function watchPage(page: Page, origin: string): Checks {
  const checks: Checks = { console: [], pageErrors: [], network: [] };
  const seen = new Set<string>();
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text().slice(0, 240);
      if (!seen.has(t)) {
        seen.add(t);
        push(checks.console, t);
      }
    }
  });
  page.on("pageerror", (e) => {
    const t = String((e as Error)?.message ?? e).slice(0, 240);
    if (!seen.has(t)) {
      seen.add(t);
      push(checks.pageErrors, t);
    }
  });
  page.on("response", (r) => {
    const status = r.status();
    // Only flag the site's own resources; third-party trackers failing is noise.
    if (status >= 400 && r.url().startsWith(origin) && !seen.has(r.url())) {
      seen.add(r.url());
      push(checks.network, { url: r.url(), status });
    }
  });
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText ?? "failed";
    if (reason.includes("ERR_ABORTED") || reason.includes("BLOCKED_BY_CLIENT")) return;
    if (r.url().startsWith(origin) && !seen.has(r.url())) {
      seen.add(r.url());
      push(checks.network, { url: r.url(), status: reason });
    }
  });
  return checks;
}

/** One-off checks on the landing page right after it loads. */
export async function inspectLanding(page: Page, viewport: Viewport, checks: Checks) {
  const data = await page.evaluate((isMobile) => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const transfer = res.reduce((s, r) => s + (r.transferSize || 0), nav?.transferSize || 0);
    const imgs = [...document.images];
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    };
    const tap = isMobile
      ? [...document.querySelectorAll("a[href], button, input, select, [role=button]")].filter((el) => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          return r.width < 24 || r.height < 24;
        }).length
      : 0;
    return {
      performance: nav
        ? {
            ttfbMs: Math.round(nav.responseStart - nav.requestStart),
            domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
            loadMs: Math.round(nav.loadEventEnd || performance.now()),
            transferKb: Math.round(transfer / 1024),
            requests: res.length + 1,
          }
        : undefined,
      meta: {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        hasViewport: !!document.querySelector('meta[name="viewport"]'),
        lang: document.documentElement.lang,
        h1Count: document.querySelectorAll("h1").length,
        https: location.protocol === "https:",
      },
      layout: {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        smallTapTargets: tap,
        imagesMissingAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
        brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.src).length,
      },
    };
  }, viewport === "mobile");
  Object.assign(checks, data);

  try {
    await page.addScriptTag({ content: axe.source });
    const out = await page.evaluate(async () => {
      // @ts-expect-error injected global
      const r = await window.axe.run(document, { resultTypes: ["violations"], runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
      return r.violations.map((v: { id: string; impact: string; help: string; nodes: unknown[] }) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
    });
    checks.a11y = out;
  } catch {
    checks.a11y = undefined;
  }
}

/** Checks same-origin links found on the landing page (desktop run only, to avoid doing it twice). */
export async function checkLinks(page: Page, origin: string, checks: Checks, deadline: number) {
  const hrefs: string[] = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href));
  const unique = [...new Set(hrefs.map((h) => h.split("#")[0]))].filter((h) => h.startsWith(origin)).slice(0, 20);
  checks.links = [];
  await Promise.all(
    unique.map(async (url) => {
      if (Date.now() > deadline) return;
      try {
        let r = await fetch(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(10000) });
        if (r.status === 405 || r.status === 403) r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000) });
        if (r.status >= 400) checks.links!.push({ url, status: r.status });
      } catch (e) {
        checks.links!.push({ url, status: (e as Error).name === "TimeoutError" ? "timeout" : "unreachable" });
      }
    }),
  );
}

/** Turns raw check data into report findings. */
export function checksToFindings(c: Checks, viewport: Viewport, url: string): Finding[] {
  const f: Finding[] = [];
  const add = (severity: Finding["severity"], category: Finding["category"], title: string, detail: string) =>
    f.push({ severity, category, title, detail, source: "check", viewport, url });

  if (c.pageErrors.length) add("major", "functional", `${c.pageErrors.length} uncaught JavaScript error(s)`, c.pageErrors.slice(0, 5).join("\n"));
  if (c.console.length) add("minor", "functional", `${c.console.length} console error(s)`, c.console.slice(0, 5).join("\n"));
  const serverErr = c.network.filter((n) => typeof n.status === "number" && n.status >= 500);
  const clientErr = c.network.filter((n) => !(typeof n.status === "number" && n.status >= 500));
  if (serverErr.length) add("major", "functional", `${serverErr.length} request(s) failed with a server error`, serverErr.slice(0, 6).map((n) => `${n.status}  ${n.url}`).join("\n"));
  if (clientErr.length) add("minor", "functional", `${clientErr.length} request(s) failed`, clientErr.slice(0, 6).map((n) => `${n.status}  ${n.url}`).join("\n"));
  // A timeout means slow, not broken.
  const broken = c.links?.filter((l) => l.status !== "timeout") ?? [];
  const slow = c.links?.filter((l) => l.status === "timeout") ?? [];
  if (broken.length) add("major", "functional", `${broken.length} broken link(s)`, broken.map((l) => `${l.status}  ${l.url}`).join("\n"));
  if (slow.length) add("minor", "performance", `${slow.length} link(s) took over 10 s to respond`, slow.map((l) => l.url).join("\n"));

  if (c.performance) {
    const { loadMs, ttfbMs, transferKb } = c.performance;
    if (loadMs > 6000) add("major", "performance", `Slow page load (${(loadMs / 1000).toFixed(1)}s)`, `Full load took ${loadMs} ms on the ${viewport} run.`);
    else if (loadMs > 3500) add("minor", "performance", `Page load could be faster (${(loadMs / 1000).toFixed(1)}s)`, `Full load took ${loadMs} ms.`);
    if (ttfbMs > 1200) add("minor", "performance", `Slow server response (TTFB ${ttfbMs} ms)`, "Time to first byte above 1.2 s.");
    if (transferKb > 4000) add("minor", "performance", `Heavy page (${(transferKb / 1024).toFixed(1)} MB transferred)`, "Consider compressing images and splitting scripts.");
  }
  if (c.meta) {
    if (!c.meta.https) add("major", "security", "Page is not served over HTTPS", url);
    if (!c.meta.title) add("minor", "seo", "Missing page title", "The <title> element is empty.");
    if (!c.meta.description) add("suggestion", "seo", "Missing meta description", "Search results will show auto-picked text.");
    if (!c.meta.hasViewport) add("major", "ui", "Missing viewport meta tag", "Mobile browsers will render the desktop layout zoomed out.");
    if (!c.meta.lang) add("minor", "accessibility", "Missing lang attribute on <html>", "Screen readers can't pick the right pronunciation.");
    if (c.meta.h1Count !== 1) add("suggestion", "seo", `${c.meta.h1Count} <h1> headings on the page`, "Exactly one <h1> is recommended.");
  }
  if (c.layout) {
    if (c.layout.horizontalOverflow) add(viewport === "mobile" ? "major" : "minor", "ui", "Content overflows horizontally", `The page scrolls sideways on ${viewport}.`);
    if (c.layout.smallTapTargets > 3) add("minor", "usability", `${c.layout.smallTapTargets} tap targets smaller than 24px`, "Small buttons and links are hard to hit on touch screens.");
    if (c.layout.brokenImages) add("major", "ui", `${c.layout.brokenImages} broken image(s)`, "Images that failed to load.");
    if (c.layout.imagesMissingAlt) add("minor", "accessibility", `${c.layout.imagesMissingAlt} image(s) without alt text`, "Add alt text (or alt=\"\" for decorative images).");
  }
  for (const v of c.a11y ?? []) {
    if (v.impact === "critical" || v.impact === "serious") add(v.impact === "critical" ? "major" : "minor", "accessibility", v.help, `axe-core rule "${v.id}" — ${v.nodes} element(s).`);
  }
  return f;
}
