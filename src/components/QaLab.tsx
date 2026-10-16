"use client";

import { useEffect, useRef, useState } from "react";
import type { Finding, RunEvent, RunResult, Step, Viewport } from "@/lib/qa/types";

type LiveFinding = Omit<Finding, "shot">;
type RunState = {
  status: string;
  frame?: string;
  url?: string;
  steps: Step[];
  findings: LiveFinding[];
  result?: RunResult;
  error?: string;
  running: boolean;
};

const empty = (): RunState => ({ status: "Waiting", steps: [], findings: [], running: false });
const SEV_ORDER = ["critical", "major", "minor", "suggestion"] as const;

function readPasscode() {
  try {
    return sessionStorage.getItem("qa-pass") ?? "";
  } catch {
    return "";
  }
}

export default function QaLab() {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [instructions, setInstructions] = useState("");
  const [passcode, setPasscode] = useState("");
  useEffect(() => setPasscode(readPasscode()), []);
  const [devices, setDevices] = useState<Record<Viewport, boolean>>({ mobile: true, desktop: true });
  const [runs, setRuns] = useState<Record<Viewport, RunState>>({ mobile: empty(), desktop: empty() });
  const [formError, setFormError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const aborts = useRef<AbortController[]>([]);

  const running = runs.mobile.running || runs.desktop.running;
  const results = (["mobile", "desktop"] as Viewport[]).map((v) => runs[v].result).filter(Boolean) as RunResult[];
  const allFindings = [...runs.mobile.findings, ...runs.desktop.findings];

  const patch = (v: Viewport, fn: (s: RunState) => RunState) => setRuns((r) => ({ ...r, [v]: fn(r[v]) }));

  async function runOne(v: Viewport, ctrl: AbortController) {
    patch(v, () => ({ ...empty(), running: true, status: "Queued…" }));
    try {
      const res = await fetch("/api/qa/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, username, password, instructions, passcode, viewport: v }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const msg = (await res.json().catch(() => null))?.error ?? `Request failed (${res.status})`;
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const e = JSON.parse(line) as RunEvent;
          patch(v, (s) => {
            switch (e.type) {
              case "status": return { ...s, status: e.message };
              case "frame": return { ...s, frame: e.shot, url: e.url };
              case "step": return { ...s, steps: [...s.steps, e.step] };
              case "finding": return { ...s, findings: [...s.findings, e.finding] };
              case "done": return { ...s, result: e.result, status: `Finished in ${Math.round(e.result.durationMs / 1000)} s`, running: false };
              case "error": return { ...s, error: e.message, status: "Stopped", running: false };
            }
          });
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") patch(v, (s) => ({ ...s, status: "Cancelled" }));
      else patch(v, (s) => ({ ...s, error: (err as Error).message, status: "Stopped" }));
    } finally {
      patch(v, (s) => ({ ...s, running: false }));
    }
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!url.trim()) return setFormError("Enter the website URL to test.");
    if (!devices.mobile && !devices.desktop) return setFormError("Pick at least one device.");
    if (!passcode) return setFormError("Enter the access passcode.");
    try {
      sessionStorage.setItem("qa-pass", passcode);
    } catch {}
    aborts.current = [];
    setRuns({ mobile: empty(), desktop: empty() });
    (["mobile", "desktop"] as Viewport[])
      .filter((v) => devices[v])
      .forEach((v) => {
        const ctrl = new AbortController();
        aborts.current.push(ctrl);
        void runOne(v, ctrl);
      });
  }

  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const res = await fetch("/api/qa/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, runs: results }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't build the report.");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "qa-report.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setPdfBusy(false);
    }
  }

  const counts = SEV_ORDER.map((s) => [s, allFindings.filter((f) => f.severity === s).length] as const);

  return (
    <div className="lab">
      <form className="lab__form" onSubmit={start}>
        <label className="field field--wide">
          <span>Website URL</span>
          <input type="text" inputMode="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} disabled={running} />
        </label>
        <label className="field">
          <span>Test username / email <em>optional</em></span>
          <input type="text" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} disabled={running} />
        </label>
        <label className="field">
          <span>Test password <em>optional</em></span>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={running} />
        </label>
        <label className="field field--wide">
          <span>What should I test? <em>optional</em></span>
          <textarea
            rows={3}
            placeholder="e.g. Log in, search for a product, add it to the cart and go to checkout (don't pay). Check the profile page."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={running}
          />
        </label>
        <div className="field">
          <span>Devices</span>
          <div className="lab__devices">
            {(["mobile", "desktop"] as Viewport[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`chip ${devices[v] ? "is-on" : ""}`}
                aria-pressed={devices[v]}
                onClick={() => setDevices((d) => ({ ...d, [v]: !d[v] }))}
                disabled={running}
              >
                {v === "mobile" ? "Mobile" : "Desktop"}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Access passcode</span>
          <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} disabled={running} />
        </label>
        <div className="lab__actions field--wide">
          {running ? (
            <button type="button" className="btn btn--ghost" onClick={() => aborts.current.forEach((c) => c.abort())}>
              Stop test
            </button>
          ) : (
            <button type="submit" className="btn">
              Run QA test
            </button>
          )}
          <p className="lab__fine">
            Use test accounts only. Credentials are used for this run only — never stored and never sent to the AI model. Typed
            usernames can appear in screenshots.
          </p>
          {formError && <p className="lab__error" role="alert">{formError}</p>}
        </div>
      </form>

      <div className="lab__stage">
        {devices.mobile && (
          <Sim kind="mobile" state={runs.mobile}>
            <div className="phone">
              <div className="phone__screen">
                {/* eslint-disable-next-line @next/next/no-img-element -- live data: URL frames */}
                {runs.mobile.frame ? <img src={`data:image/jpeg;base64,${runs.mobile.frame}`} alt="Live mobile view" /> : <Idle />}</div>
            </div>
          </Sim>
        )}
        {devices.desktop && (
          <Sim kind="desktop" state={runs.desktop}>
            <div className="browser">
              <div className="browser__bar">
                <i /><i /><i />
                <span>{runs.desktop.url ?? "about:blank"}</span>
              </div>
              <div className="browser__screen">
                {/* eslint-disable-next-line @next/next/no-img-element -- live data: URL frames */}
                {runs.desktop.frame ? <img src={`data:image/jpeg;base64,${runs.desktop.frame}`} alt="Live desktop view" /> : <Idle />}</div>
            </div>
          </Sim>
        )}
      </div>

      {(allFindings.length > 0 || results.length > 0) && (
        <div className="lab__results">
          <div className="lab__results-head">
            <div className="lab__counts">
              {counts.map(([s, n]) => (
                <div key={s} className={`count count--${s}`}>
                  <b>{n}</b>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <button className="btn" onClick={downloadPdf} disabled={running || !results.length || pdfBusy}>
              {pdfBusy ? "Building PDF…" : running ? "Report ready when tests finish" : "Download PDF report"}
            </button>
          </div>
          <ul className="lab__findings">
            {[...allFindings]
              .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity))
              .map((f, i) => (
                <li key={i}>
                  <span className={`sev sev--${f.severity}`}>{f.severity}</span>
                  <div>
                    <b>{f.title}</b>
                    <small>
                      {f.viewport} · {f.category} · {f.source === "ai" ? "AI tester" : "automated check"}
                    </small>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Idle() {
  return <div className="sim__idle mono">Waiting for a test run</div>;
}

function Sim({ kind, state, children }: { kind: Viewport; state: RunState; children: React.ReactNode }) {
  return (
    <div className={`sim sim--${kind}`}>
      <div className="sim__head">
        <span className="eyebrow">{kind === "mobile" ? "Mobile · 390×844" : "Desktop · 1366×768"}</span>
        <span className={`sim__status ${state.running ? "is-live" : ""}`}>{state.status}</span>
      </div>
      {children}
      {state.error && <p className="lab__error">{state.error}</p>}
      <ol className="sim__log mono">
        {state.steps.slice(-8).map((s) => (
          <li key={s.n} className={s.ok ? "" : "fail"}>
            <span>{String(s.n).padStart(2, "0")}</span> {s.action}
            {s.error && <em> — {s.error}</em>}
          </li>
        ))}
      </ol>
    </div>
  );
}
