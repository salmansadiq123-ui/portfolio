"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import type { Project } from "@/data/projects";
import Lightbox from "./Lightbox";

const ease = [0.22, 1, 0.36, 1] as const;

export default function ProjectView({ project: p }: { project: Project }) {
  const [open, setOpen] = useState<number | null>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  // Prefer a landscape-ish shot for the wide cover when one exists.
  const coverIdx = Math.max(0, p.shots.findIndex((s) => s.w / s.h > 1.2));
  const cover = p.shots[coverIdx];
  const items = p.shots.map((s) => ({ ...s, title: p.name, sub: p.tagline }));

  return (
    <>
      <section className="phero wrap">
        <Link href="/#work" className="phero__back">
          ← All work
        </Link>
        <h1 className="phero__title" style={{ overflow: "hidden" }}>
          <motion.span style={{ display: "block" }} initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 1.1, ease }}>
            {p.name}
          </motion.span>
        </h1>
        <motion.div className="phero__grid" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: 0.3 }}>
          <div>
            <h4>Overview</h4>
            <p>
              <span className="serif" style={{ color: "var(--paper)", fontSize: 22 }}>
                {p.tagline}.
              </span>{" "}
              {p.description}
            </p>
          </div>
          <div>
            <h4>Deliverables</h4>
            <ul>
              {p.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Context</h4>
            <ul>
              <li>{p.type}</li>
              <li>{p.year}</li>
              <li style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <i style={{ width: 10, height: 10, borderRadius: 99, background: p.accent, display: "inline-block" }} />
                {p.accent}
              </li>
            </ul>
          </div>
          <div>
            <h4>Live</h4>
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
                {p.url.replace(/^https?:\/\/(www\.)?/, "")} ↗
              </a>
            ) : (
              <p>—</p>
            )}
          </div>
        </motion.div>
      </section>

      <div className="wrap">
        <motion.div
          ref={coverRef}
          className="pcover"
          style={{ background: p.accent }}
          initial={{ clipPath: "inset(12% 8% 12% 8% round 16px)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0% round 16px)" }}
          transition={{ duration: 1.4, ease, delay: 0.2 }}
          data-cursor="View"
          onClick={() => setOpen(coverIdx)}
        >
          <motion.div style={{ y, position: "absolute", inset: 0 }}>
            <Image src={cover.src} alt={`${p.name} cover`} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
          </motion.div>
        </motion.div>
      </div>

      <section className="section wrap" style={{ paddingTop: 80 }}>
        <div className="section__head" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Gallery · {p.shots.length} pieces</span>
        </div>
        <div className="masonry" style={{ columns: "3 280px" }}>
          {p.shots.map((s, i) => (
            <motion.button
              key={s.src}
              className="tile"
              data-cursor="View"
              onClick={() => setOpen(i)}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5% 0px" }}
              transition={{ duration: 0.9, ease, delay: (i % 3) * 0.08 }}
              aria-label={`Open ${p.name} piece ${i + 1}`}
            >
              <Image src={s.src} alt={`${p.name} — piece ${i + 1}`} width={s.w} height={s.h} sizes="(max-width: 700px) 100vw, 33vw" />
            </motion.button>
          ))}
        </div>
      </section>

      <Lightbox items={items} index={open} onChange={setOpen} />
    </>
  );
}
