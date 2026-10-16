"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { categories, projects, type Category } from "@/data/projects";
import Lightbox, { type LightboxItem } from "./Lightbox";

const PAGE = 24;

// Interleave brands so the default view shows variety instead of one brand at a time.
// Each queue is rotated by two so the opening rows lead with campaign work, not logos.
function interleave() {
  const queues = projects.map((p) => {
    const q = p.shots.map((s) => ({ ...s, project: p }));
    return [...q.slice(2), ...q.slice(0, 2)];
  });
  const out: (typeof queues)[number] = [];
  for (let i = 0; queues.some((q) => q.length); i++) {
    const q = queues[i % queues.length];
    if (q.length) out.push(q.shift()!);
  }
  return out;
}
const all = interleave();

export default function Catalog() {
  const [cat, setCat] = useState<Category | "All">("All");
  const [brand, setBrand] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      all.filter(
        (s) => (cat === "All" || s.project.categories.includes(cat)) && (!brand || s.project.slug === brand),
      ),
    [cat, brand],
  );
  const visible = filtered.slice(0, limit);
  const lbItems: LightboxItem[] = useMemo(
    () => filtered.map((s) => ({ src: s.src, w: s.w, h: s.h, title: s.project.name, sub: s.project.tagline })),
    [filtered],
  );

  const count = (c: Category | "All") =>
    c === "All" ? all.length : all.filter((s) => s.project.categories.includes(c)).length;

  const brandList = projects.filter((p) => cat === "All" || p.categories.includes(cat));

  return (
    <section className="section wrap" id="catalog">
      <div className="section__head">
        <div>
          <span className="eyebrow">Work catalog</span>
          <h2 className="section__title">
            The full <span className="serif">archive</span>
          </h2>
        </div>
        <p className="section__aside">
          {all.length} pieces across {projects.length} collections. Filter by discipline or brand, then click any piece to
          view it full-size.
        </p>
      </div>

      <div className="filters" role="tablist" aria-label="Filter by discipline">
        {(["All", ...categories] as const).map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            className={`chip${cat === c ? " is-on" : ""}`}
            onClick={() => {
              setCat(c);
              setBrand(null);
              setLimit(PAGE);
            }}
          >
            {c} <sup>{count(c)}</sup>
          </button>
        ))}
      </div>
      <div className="brands" aria-label="Filter by brand">
        {brandList.map((p) => (
          <button
            key={p.slug}
            className={brand === p.slug ? "is-on" : ""}
            onClick={() => {
              setBrand(brand === p.slug ? null : p.slug);
              setLimit(PAGE);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="masonry" key={`${cat}-${brand}`}>
          {visible.map((s, i) => (
            <motion.button
              key={s.src}
              className="tile"
              data-cursor="View"
              onClick={() => setOpen(i)}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (i % PAGE) * 0.02 }}
              aria-label={`Open ${s.project.name} piece`}
            >
              <Image src={s.src} alt={`${s.project.name} — ${s.project.tagline}`} width={s.w} height={s.h} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" />
              <span className="tile__cap">
                <span>
                  <i style={{ background: s.project.accent }} />
                  {s.project.name}
                </span>
                <span style={{ color: "var(--paper-dim)" }}>↗</span>
              </span>
            </motion.button>
          ))}
      </div>

      {limit < filtered.length && (
        <div className="catalog__more">
          <button className="btn btn--ghost" onClick={() => setLimit((l) => l + PAGE)}>
            Load more <span className="mono" style={{ fontSize: 12 }}>({filtered.length - limit})</span>
          </button>
        </div>
      )}

      <Lightbox items={lbItems} index={open} onChange={setOpen} />
    </section>
  );
}
