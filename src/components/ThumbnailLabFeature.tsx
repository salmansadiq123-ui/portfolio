import Link from "next/link";
import Reveal from "./Reveal";

// Hand-drawn sample thumbnails for the teaser, so the home page doesn't spend AI quota.
const samples = [
  { bg: "linear-gradient(135deg,#d00000,#ffba08)", text: "I TRIED", hl: "IT ALL", accent: "#ffee32", emoji: "🤯", font: "Impact, 'Arial Black', sans-serif" },
  { bg: "linear-gradient(135deg,#020617,#0c4a6e)", text: "AI DID", hl: "THIS?", accent: "#38bdf8", emoji: "🤖", font: "'Arial Black', Helvetica, sans-serif" },
  { bg: "linear-gradient(135deg,#1b0b3a,#ff3d7f)", text: "RETRO", hl: "VIBES", accent: "#ffd319", emoji: "🌆", font: "Impact, 'Arial Black', sans-serif" },
  { bg: "linear-gradient(135deg,#0a0806,#2a2117)", text: "Quiet", hl: "Luxury", accent: "#d4af37", emoji: "", font: "Georgia, 'Times New Roman', serif" },
];

export default function ThumbnailLabFeature() {
  return (
    <section className="section wrap labf" id="thumbnail-lab">
      <div className="labf__grid">
        <div>
          <span className="eyebrow">New · Thumbnail Lab</span>
          <h2 className="section__title">
            Thumbnails in <span className="serif">4K.</span>
          </h2>
          <p className="section__aside" style={{ marginTop: 24 }}>
            Give it your video title, description and topics, pick a style — modern, bold, cinematic, gaming, neon and more — and Gemini designs
            click-worthy YouTube thumbnails. Edit the text and colours, then download at 3840×2160.
          </p>
          <div className="labf__cta">
            <Link href="/thumbnail-lab" className="btn" data-cursor="Open">
              Open the Thumbnail Lab
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <span className="labf__note mono">Free · powered by Gemini · 3840×2160</span>
          </div>
        </div>
        <Reveal y={60}>
          <div className="thumbf__grid" aria-hidden>
            {samples.map((s) => (
              <div key={s.hl} className="thumbf__item" style={{ background: s.bg, fontFamily: s.font }}>
                <b>
                  {s.text}
                  <br />
                  <span style={{ color: s.accent }}>{s.hl}</span>
                </b>
                {s.emoji && <i>{s.emoji}</i>}
                <small>4K</small>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
