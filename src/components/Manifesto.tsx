"use client";

import { animate, motion, useInView, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { projects, totalShots } from "@/data/projects";

const text =
  "I design brands that feel considered — logos, campaigns, books and comics — then test the products behind them until they hold up. Good design should look right and work right.";

function Word({ w, i, n, progress }: { w: string; i: number; n: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [i / n, (i + 1) / n], [0.15, 1]);
  const isAccent = /work|right/.test(w);
  return (
    <motion.span className={`w${isAccent ? " serif" : ""}`} style={{ opacity, color: isAccent ? "var(--accent)" : undefined }}>
      {w}
    </motion.span>
  );
}

function Count({ to, suffix = "+" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <div className="stat__n" ref={ref}>
      <span>{v}</span>
      <sup>{suffix}</sup>
    </div>
  );
}

export default function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  const brands = projects.filter((p) => p.type !== "Freelance & earlier").length;

  return (
    <section className="section wrap" id="about">
      <span className="eyebrow">About</span>
      <p ref={ref} className="manifesto__text" style={{ marginTop: 32 }}>
        {words.map((w, i) => (
          <Word key={i} w={w} i={i} n={words.length} progress={scrollYProgress} />
        ))}
      </p>
      <div className="manifesto__stats">
        <div className="stat">
          <Count to={6} />
          <div className="stat__l">Years designing</div>
        </div>
        <div className="stat">
          <Count to={brands} />
          <div className="stat__l">Brands at Kakushin</div>
        </div>
        <div className="stat">
          <Count to={totalShots} />
          <div className="stat__l">Pieces in this catalog</div>
        </div>
        <div className="stat">
          <Count to={10} />
          <div className="stat__l">Products QA-tested</div>
        </div>
      </div>
    </section>
  );
}
