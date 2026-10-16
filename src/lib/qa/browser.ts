import { existsSync } from "node:fs";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import type { Viewport } from "./types";
import { isBlockedHost } from "./guard";

const LOCAL_BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

// Serverless (Vercel/Lambda) uses @sparticuz/chromium; local dev uses an installed Chrome/Edge.
export async function launchBrowser(): Promise<Browser> {
  const serverless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }
  const executablePath = process.env.CHROME_PATH || LOCAL_BROWSERS.find((p) => existsSync(p));
  if (!executablePath) throw new Error("No local Chrome/Edge found. Set CHROME_PATH in .env.local.");
  return puppeteer.launch({ executablePath, headless: true, args: ["--no-first-run", "--no-default-browser-check"] });
}

export const VIEWPORTS: Record<Viewport, { width: number; height: number; deviceScaleFactor: number; isMobile: boolean; hasTouch: boolean; userAgent?: string }> = {
  mobile: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
  desktop: { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

export async function preparePage(browser: Browser, viewport: Viewport): Promise<Page> {
  const page = await browser.newPage();
  const v = VIEWPORTS[viewport];
  await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: v.deviceScaleFactor, isMobile: v.isMobile, hasTouch: v.hasTouch });
  if (v.userAgent) await page.setUserAgent({ userAgent: v.userAgent });
  // Lets us inject axe-core even on sites with a strict CSP.
  await page.setBypassCSP(true);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    try {
      if (isBlockedHost(new URL(req.url()).hostname)) return void req.abort("blockedbyclient");
    } catch {}
    void req.continue();
  });
  trackNavigation(page);
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  return page;
}

/** Small JPEG for the live view, the LLM and the report. */
export async function snap(page: Page, quality = 55): Promise<string> {
  const buf = await page.screenshot({ type: "jpeg", quality, optimizeForSpeed: true });
  return Buffer.from(buf).toString("base64");
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Main-frame page loads in flight, so actions never run against a page that is about to be replaced.
const navInFlight = new WeakMap<Page, boolean>();
function trackNavigation(page: Page) {
  page.on("request", (r) => {
    if (r.isNavigationRequest() && r.frame() === page.mainFrame()) navInFlight.set(page, true);
  });
  page.on("domcontentloaded", () => navInFlight.set(page, false));
  page.on("requestfailed", (r) => {
    if (r.isNavigationRequest() && r.frame() === page.mainFrame()) navInFlight.set(page, false);
  });
}

/** Waits for the page to settle after an action: any page load it started, then network quiet. */
export async function settle(page: Page) {
  await sleep(500); // give a click time to start a navigation
  for (const until = Date.now() + 12000; navInFlight.get(page) && Date.now() < until; ) await sleep(150);
  await page.waitForNetworkIdle({ idleTime: 400, timeout: 4000 }).catch(() => {});
}
