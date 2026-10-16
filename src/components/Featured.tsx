"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/projects";

const featured = ["dementiabuddy", "mysizer", "mt4life", "ecoclean", "founders12", "l3arn", "kakushin"];
// Cover shot index per project — the strongest single image for each.
const cover: Record<string, number> = { dementiabuddy: 2, mysizer: 3, mt4life: 3, ecoclean: 10, founders12: 0, l3arn: 1, kakushin: 3 };

export default function Featured() {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useEffect(() => {
    const measure = () => {
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const items = featured.map((s) => projects.find((p) => p.slug === s)!);

  return (
    <section ref={outer} className="featured" id="work" style={{ height: `calc(100svh + ${distance}px)` }}>
      <div className="featured__sticky">
        <motion.div ref={track} className="featured__track" style={{ x }}>
          <div className="featured__intro">
            <div>
              <span className="eyebrow">Selected work</span>
              <h2 className="section__title">
                Featured <span className="serif">projects</span>
              </h2>
            </div>
            <p className="section__aside">
              Seven brand stories from Kakushin — from campaign systems to 100-page handbooks. Scroll to explore, click to
              open the full case.
            </p>
          </div>
          {items.map((p, i) => {
            const shot = p.shots[cover[p.slug] ?? 0];
            return (
              <Link key={p.slug} href={`/work/${p.slug}`} className="fcard" data-cursor="Open">
                <div className="fcard__media" style={{ background: p.accent }}>
                  <span className="fcard__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fcard__chip">{p.categories[0]}</span>
                  <Image src={shot.src} alt={`${p.name} — ${p.tagline}`} fill sizes="(max-width: 760px) 80vw, 40vw" />
                </div>
                <div className="fcard__body">
                  <div>
                    <div className="fcard__name">{p.name}</div>
                    <div className="fcard__tag">{p.tagline}</div>
                  </div>
                  <span className="fcard__year">{p.year}</span>
                </div>
              </Link>
            );
          })}
        </motion.div>
        <div className="featured__progress">
          <motion.span style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
    </section>
  );
}
