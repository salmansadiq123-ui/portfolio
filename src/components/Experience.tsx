import Reveal from "./Reveal";
import { education, experience } from "@/data/profile";

export default function Experience() {
  return (
    <section className="section wrap" id="experience">
      <div className="section__head">
        <div>
          <span className="eyebrow">Experience</span>
          <h2 className="section__title">
            The <span className="serif">journey</span>
          </h2>
        </div>
        <div className="section__aside">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Education</div>
          {education.map((e) => (
            <div key={e} style={{ fontSize: 15, marginBottom: 4 }}>
              {e}
            </div>
          ))}
        </div>
      </div>
      <div className="xp">
        {experience.map((x, i) => (
          <Reveal key={x.company} delay={i * 0.04} className="xp__row">
            <div className="xp__period">{x.period}</div>
            <div>
              <div className="xp__company">{x.company}</div>
              <div className="xp__role">
                {x.role} · <span style={{ color: "var(--paper-dim)" }}>{x.place}</span>
              </div>
            </div>
            <ul className="xp__points">
              {x.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
