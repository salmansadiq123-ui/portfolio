import Link from "next/link";
import Reveal from "./Reveal";

const steps = [
  { n: "01", t: "Paste a URL", d: "Add a test login and, if you like, the flow to check — sign-up, checkout, dashboard." },
  { n: "02", t: "Watch it test", d: "An AI tester drives a real browser on a phone and a desktop at the same time, live." },
  { n: "03", t: "Get the report", d: "A PDF with a quality score, every bug with screenshots, speed, accessibility and SEO checks." },
];

const findings = [
  { s: "major", t: "Checkout button does nothing on mobile" },
  { s: "minor", t: "Text overlaps the header at 390px" },
  { s: "minor", t: "3 images without alt text" },
];

export default function QaLabFeature() {
  return (
    <section className="section wrap labf" id="qa-lab">
      <div className="labf__grid">
        <div>
          <span className="eyebrow">New · QA Lab</span>
          <h2 className="section__title">
            Test any site, <span className="serif">automatically.</span>
          </h2>
          <p className="section__aside" style={{ marginTop: 24 }}>
            I built my QA process into a tool. Give it a website and a test account — it logs in, works through the real user
            flows on mobile and desktop, and hands back a client-ready bug report.
          </p>
          <ol className="labf__steps">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <li>
                  <span className="mono">{s.n}</span>
                  <div>
                    <b>{s.t}</b>
                    <p>{s.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="labf__cta">
            <Link href="/qa-lab" className="btn" data-cursor="Open">
              Open the QA Lab
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <span className="labf__note mono">Access by passcode — ask me for one.</span>
          </div>
        </div>

        <Reveal y={60}>
          <div className="labf__visual" aria-hidden>
            <div className="labf__browser">
              <div className="browser__bar">
                <i /><i /><i />
                <span>yourproduct.com/checkout</span>
              </div>
              <div className="labf__screen">
                <div className="labf__ph labf__ph--nav" />
                <div className="labf__ph labf__ph--hero" />
                <div className="labf__row">
                  <div className="labf__ph" />
                  <div className="labf__ph" />
                  <div className="labf__ph" />
                </div>
                <i className="labf__scan" />
              </div>
            </div>
            <div className="labf__phone">
              <div className="labf__phone-screen">
                <div className="labf__ph labf__ph--nav" />
                <div className="labf__ph labf__ph--hero" />
                <div className="labf__ph" />
                <div className="labf__ph labf__ph--btn" />
                <i className="labf__scan" />
              </div>
            </div>
            <div className="labf__report">
              <div className="labf__score">
                <b>82</b>
                <span className="mono">Quality score</span>
              </div>
              <ul>
                {findings.map((f) => (
                  <li key={f.t}>
                    <span className={`sev sev--${f.s}`}>{f.s}</span>
                    {f.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
