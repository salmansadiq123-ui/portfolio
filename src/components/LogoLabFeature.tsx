import Link from "next/link";
import Reveal from "./Reveal";

// Hand-drawn sample marks for the teaser, so the home page doesn't spend AI quota.
const samples = [
  { bg: "#1f3d2b", fg: "#f3ead8", label: "Northwind", mark: <path d="M40 66 L60 30 L80 66 Z M52 66 L60 52 L68 66" fill="none" strokeWidth="5" strokeLinejoin="round" /> },
  { bg: "#f3ead8", fg: "#c2410c", label: "Ember", mark: <path d="M60 28 C74 44 80 54 74 66 C70 74 50 74 46 66 C42 58 50 50 54 44 C56 52 62 54 64 48 C66 42 62 34 60 28 Z" strokeWidth="0" /> },
  { bg: "#111827", fg: "#a3e635", label: "Pixelon", mark: <g strokeWidth="0"><rect x="40" y="30" width="16" height="16" /><rect x="64" y="30" width="16" height="16" opacity=".55" /><rect x="40" y="54" width="16" height="16" opacity=".55" /><rect x="64" y="54" width="16" height="16" /></g> },
  { bg: "#ede9fe", fg: "#4c1d95", label: "Aura", mark: <g fill="none" strokeWidth="4"><circle cx="60" cy="50" r="20" /><circle cx="60" cy="50" r="10" /></g> },
];

export default function LogoLabFeature() {
  return (
    <section className="section wrap labf" id="logo-lab">
      <div className="labf__grid">
        <Reveal y={60}>
          <div className="logof__grid" aria-hidden>
            {samples.map((s) => (
              <svg key={s.label} viewBox="0 0 120 120" style={{ background: s.bg }} fill={s.fg} stroke={s.fg}>
                {s.mark}
                <text x="60" y="98" textAnchor="middle" fontSize="13" fontWeight="600" stroke="none" fontFamily="Helvetica, Arial, sans-serif">
                  {s.label}
                </text>
              </svg>
            ))}
          </div>
        </Reveal>
        <div>
          <span className="eyebrow">New · Logo Lab</span>
          <h2 className="section__title">
            A logo in <span className="serif">seconds.</span>
          </h2>
          <p className="section__aside" style={{ marginTop: 24 }}>
            Describe your brand, pick a style, and an AI drafts four logo directions as vector files. Download them as SVG or
            PNG — or bring your favourite to me and I&apos;ll turn it into a full identity.
          </p>
          <div className="labf__cta">
            <Link href="/logo-lab" className="btn" data-cursor="Open">
              Open the Logo Lab
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <span className="labf__note mono">Free · powered by Gemini</span>
          </div>
        </div>
      </div>
    </section>
  );
}
