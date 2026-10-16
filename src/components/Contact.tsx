"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: "inline-block" }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.35);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

function LocalTime() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () =>
      setT(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }).format(new Date()));
    f();
    const id = setInterval(f, 15000);
    return () => clearInterval(id);
  }, []);
  return <span>{t || "—"} PKT</span>;
}

export default function Contact() {
  const [copied, setCopied] = useState(false);
  return (
    <section className="contact wrap" id="contact">
      <div>
        <span className="eyebrow">Contact</span>
        <motion.h2
          className="contact__big"
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Let&apos;s make <br />
          something <span className="serif">great.</span>
        </motion.h2>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <a className="contact__mail" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <Magnetic>
            <button
              className="btn"
              style={{ marginTop: 40 }}
              onClick={() => {
                navigator.clipboard?.writeText(profile.email).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                });
              }}
            >
              {copied ? "Copied ✓" : "Copy email"}
            </button>
          </Magnetic>
        </div>
      </div>

      <div>
        <div className="contact__grid">
          <div>
            <h4>Phone</h4>
            {profile.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, "")}`}>
                {p}
              </a>
            ))}
          </div>
          <div>
            <h4>Based in</h4>
            <span>{profile.location}</span>
          </div>
          <div>
            <h4>Local time</h4>
            <LocalTime />
          </div>
          <div>
            <h4>Elsewhere</h4>
            <a href="/cv">CV / Résumé ↗</a>
            {profile.behance && (
              <a href={profile.behance} target="_blank" rel="noreferrer">
                Behance ↗
              </a>
            )}
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
        <footer className="footer">
          <span>© {new Date().getFullYear()} Salman Sadiq</span>
          <span>Designed &amp; built with care · Next.js</span>
        </footer>
      </div>
    </section>
  );
}
