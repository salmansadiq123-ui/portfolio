export type Viewport = "mobile" | "desktop";
export type Severity = "critical" | "major" | "minor" | "suggestion";
export type Category = "functional" | "ui" | "content" | "usability" | "accessibility" | "performance" | "seo" | "security";

export type Finding = {
  severity: Severity;
  title: string;
  detail: string;
  category: Category;
  source: "ai" | "check";
  viewport: Viewport;
  url?: string;
  shot?: string; // base64 JPEG, no data: prefix
};

export type Step = {
  n: number;
  action: string;
  url: string;
  ok: boolean;
  error?: string;
  thought?: string;
};

export type Checks = {
  performance?: { ttfbMs: number; domContentLoadedMs: number; loadMs: number; transferKb: number; requests: number };
  meta?: { title: string; description: string; hasViewport: boolean; lang: string; h1Count: number; https: boolean };
  a11y?: { id: string; impact: string; help: string; nodes: number }[];
  console: string[];
  pageErrors: string[];
  network: { url: string; status: number | string }[];
  links?: { url: string; status: number | string }[];
  layout?: { horizontalOverflow: boolean; smallTapTargets: number; imagesMissingAlt: number; brokenImages: number };
};

export type RunResult = {
  viewport: Viewport;
  url: string;
  startedAt: string;
  durationMs: number;
  mode: "ai" | "auto";
  steps: Step[];
  findings: Finding[];
  checks: Checks;
  firstShot?: string;
  lastShot?: string;
  note?: string;
};

// Streamed to the browser as NDJSON, one event per line.
export type RunEvent =
  | { type: "status"; message: string }
  | { type: "frame"; shot: string; url: string }
  | { type: "step"; step: Step }
  | { type: "finding"; finding: Omit<Finding, "shot"> }
  | { type: "done"; result: RunResult }
  | { type: "error"; message: string };

export type RunInput = {
  url: string;
  username?: string;
  password?: string;
  instructions?: string;
  viewport: Viewport;
};
