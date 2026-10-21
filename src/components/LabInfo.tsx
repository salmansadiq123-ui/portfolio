import type { Lab } from "@/lib/seo";
import { jsonLd, labJsonLd } from "@/lib/seo";

// Server-rendered "how it works" + FAQ under each lab, so search engines and AI answer engines
// see real text (the tools themselves are client-side). Mirrors the JSON-LD exactly.
export default function LabInfo({ lab }: { lab: Lab }) {
  return (
    <section className="labinfo" aria-labelledby={`${lab.slug}-how`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(labJsonLd(lab))} />
      <div className="labinfo__col">
        <span className="eyebrow">How it works</span>
        <h2 id={`${lab.slug}-how`} className="labinfo__title">
          How to use {lab.name}
        </h2>
        <ol className="labinfo__steps">
          {lab.steps.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <ul className="labinfo__features">
          {lab.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div className="labinfo__col">
        <span className="eyebrow">FAQ</span>
        <h2 className="labinfo__title">{lab.name} questions</h2>
        <div className="labinfo__faq">
          {lab.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
