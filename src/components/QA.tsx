"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { qaProducts } from "@/data/profile";

type L = { t: string; c?: string };

// A scripted, illustrative test run — shows how Salman approaches a release check.
const script: L[] = [
  { t: "$ qa run --suite release --product founders12", c: "t-dim" },
  { t: "› Loading 48 test cases …", c: "t-info" },
  { t: "✓ Sign-up flow · email + validation", c: "t-pass" },
  { t: "✓ Dashboard loads under 2s", c: "t-pass" },
  { t: "✓ Stripe checkout · test card", c: "t-pass" },
  { t: "✗ Mobile 375px · CTA overlaps footer", c: "t-fail" },
  { t: "  → BUG-214 logged with screenshot + repro steps", c: "t-dim" },
  { t: "✓ Brand fonts + colours match guidelines", c: "t-pass" },
  { t: "✓ Safari / Chrome / Android regression", c: "t-pass" },
  { t: "✓ Re-test BUG-214 after fix", c: "t-pass" },
  { t: "" },
  { t: "48 passed · 0 failed · ready to ship 🚀", c: "t-pass" },
];

export default function QA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [lines, setLines] = useState<L[]>([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      for (const l of script) {
        if (cancelled) return;
        if (l.t.startsWith("$")) {
          for (let i = 1; i <= l.t.length; i++) {
            if (cancelled) return;
            setTyping(l.t.slice(0, i));
            await sleep(28);
          }
          setTyping("");
        } else {
          await sleep(l.c === "t-fail" ? 650 : 320);
        }
        setLines((ls) => [...ls, l]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  return (
    <section className="section qa wrap" id="qa">
      <div className="qa__grid">
        <div>
          <span className="eyebrow">Quality assurance</span>
          <h2 className="section__title">
            I also <span className="serif">break</span> things — on purpose.
          </h2>
          <p className="section__aside" style={{ marginTop: 24 }}>
            At Kakushin I&apos;m the QA engineer as well as the designer. Before a product goes live I test the flows, the
            payments, every screen size and the visual details — then write bug reports developers can act on straight away.
          </p>
          <div style={{ marginTop: 28 }}>
            <span className="qa__badge">All checks passing</span>
          </div>
          <Reveal>
            <ul className="qa__list">
              {qaProducts.map((p) => (
                <li key={p.name}>
                  <a href={p.url} target="_blank" rel="noreferrer" data-cursor="Visit">
                    <span>{p.name}</span>
                    <small>{p.kind}</small>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal y={60}>
          <div className="term" ref={ref} aria-label="Example test run">
            <div className="term__bar">
              <i /> <i /> <i />
              <span>example release check</span>
            </div>
            <div className="term__body">
              {lines.map((l, i) => (
                <div key={i} className={`term__line ${l.c ?? ""}`}>
                  {l.t || " "}
                </div>
              ))}
              <div className="term__line t-dim">
                {typing}
                <span className="caret" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
