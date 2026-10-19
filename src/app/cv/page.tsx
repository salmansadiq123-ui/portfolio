import type { Metadata } from "next";
import Link from "next/link";
import { cv, experience, profile, qaProducts } from "@/data/profile";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "CV",
  description: `CV of ${profile.name}, ${profile.role} based in ${profile.location}.`,
};

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export default function CvPage() {
  return (
    <main className="cv-page">
      <div className="cv-bar wrap">
        <Link href="/" className="phero__back">
          ← Back to portfolio
        </Link>
        <div className="cv-bar__actions">
          <PrintButton />
          <a className="btn" href="/Salman-Sadiq-CV.pdf" download>
            Download PDF
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 4v12M6 11l6 6 6-6M5 20h14" />
            </svg>
          </a>
        </div>
      </div>

      <article className="cv" aria-label={`${profile.name} — CV`}>
        <header className="cv__head">
          <div>
            <h1 className="cv__name">{profile.name}</h1>
            <p className="cv__role">
              Graphic Designer <span className="serif">&amp;</span> QA Engineer
            </p>
          </div>
          <ul className="cv__contact">
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>{profile.phones.join(" · ")}</li>
            <li>
              {profile.location} · <a href={profile.site}>www.{host(profile.site)}</a>
            </li>
            <li>
              <a href={profile.behance}>{host(profile.behance)}</a>
            </li>
            <li>
              <a href={profile.linkedin}>{host(profile.linkedin)}</a>
            </li>
          </ul>
        </header>

        <p className="cv__summary">{cv.summary}</p>

        <div className="cv__cols">
          <div className="cv__main">
            <section>
              <h2 className="cv__h">Experience</h2>
              {experience.map((x) => (
                <div key={x.company} className="cv__job">
                  <div className="cv__job-top">
                    <h3>
                      {x.role} <span>· {x.company}</span>
                    </h3>
                    <span className="cv__when">{x.period.replace("—", "–")}</span>
                  </div>
                  <div className="cv__where">{x.place}</div>
                  <ul>
                    {(cv.points[x.company] ?? x.points).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </div>

          <aside className="cv__side">
            <section>
              <h2 className="cv__h">Skills</h2>
              {cv.skills.map((g) => (
                <div key={g.label} className="cv__group">
                  <h3>{g.label}</h3>
                  <p>{g.items.join(", ")}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="cv__h">Products QA-tested</h2>
              <ul className="cv__plain cv__plain--inline">
                {qaProducts.map((p) => (
                  <li key={p.name}>
                    <b>{p.name}</b> <span>{p.kind}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="cv__h">Certifications</h2>
              <ul className="cv__plain">
                {cv.certifications.map((c) => (
                  <li key={c.name}>
                    <b>{c.name}</b> <span>{c.org}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="cv__h">Education</h2>
              <ul className="cv__plain cv__plain--inline">
                {cv.academics.map((c) => (
                  <li key={c.name}>
                    <b>{c.name}</b> <span>{c.org}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="cv__h">Languages</h2>
              <ul className="cv__plain">
                {cv.languages.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
