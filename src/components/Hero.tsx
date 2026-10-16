"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useIntroReady } from "./Preloader";
import { projects } from "@/data/projects";

const ease = [0.22, 1, 0.36, 1] as const;
const roles = ["Graphic Designer", "QA Engineer", "Brand Builder", "Visual Storyteller"];

const pick = (slug: string, i: number) => projects.find((p) => p.slug === slug)!.shots[i];
const floats = [
  { shot: pick("mysizer", 0), style: { left: "6%", top: "14%", width: "clamp(110px, 13vw, 210px)" }, depth: 40, rot: -8 },
  { shot: pick("dementiabuddy", 2), style: { left: "40%", top: "8%", width: "clamp(90px, 10vw, 170px)" }, depth: 22, rot: 5 },
  { shot: pick("ecoclean", 2), style: { right: "22%", top: "26%", width: "clamp(100px, 12vw, 200px)" }, depth: 55, rot: 7 },
  { shot: pick("l3arn", 0), style: { left: "24%", top: "34%", width: "clamp(80px, 8vw, 140px)" }, depth: 30, rot: -4 },
];

function Line({ text, delay, ready, className = "" }: { text: string; delay: number; ready: boolean; className?: string }) {
  return (
    <span className={`hero__line ${className}`} aria-hidden>
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{ y: "110%" }}
          animate={ready ? { y: "0%" } : undefined}
          transition={{ duration: 1.1, ease, delay: delay + i * 0.035 }}
        >
          {c === " " ? " " : c}
        </motion.span>
      ))}
    </span>
  );
}

function Float({ f, i, ready, mx, my }: { f: (typeof floats)[number]; i: number; ready: boolean; mx: ReturnType<typeof useSpring>; my: ReturnType<typeof useSpring> }) {
  const x = useTransform(mx, (v: number) => v * f.depth);
  const y = useTransform(my, (v: number) => v * f.depth);
  return (
    <motion.div className="hero__float" style={{ ...f.style, x, y, rotate: f.rot }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.6, clipPath: "inset(50% 50% 50% 50%)" }}
        animate={ready ? { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" } : undefined}
        transition={{ duration: 1.2, ease, delay: 0.9 + i * 0.12 }}
      >
        <Image src={f.shot.src} alt="" width={f.shot.w} height={f.shot.h} sizes="220px" priority />
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const ready = useIntroReady();
  const ref = useRef<HTMLElement>(null);
  const [role, setRole] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const floatsY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 20 });
  const my = useSpring(rawY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX / innerWidth - 0.5);
      rawY.set(e.clientY / innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    const t = setInterval(() => setRole((r) => (r + 1) % roles.length), 2200);
    return () => {
      window.removeEventListener("pointermove", onMove);
      clearInterval(t);
    };
  }, [rawX, rawY]);

  return (
    <section ref={ref} className="hero wrap" id="top">
      <motion.div className="hero__floats" style={{ y: floatsY }} aria-hidden>
        {floats.map((f, i) => (
          <Float key={i} f={f} i={i} ready={ready} mx={mx} my={my} />
        ))}
      </motion.div>

      <motion.div
        className="hero__badge"
        initial={{ opacity: 0, rotate: -90 }}
        animate={ready ? { opacity: 1, rotate: 0 } : undefined}
        transition={{ duration: 1.4, ease, delay: 1.2 }}
        aria-hidden
      >
        <svg viewBox="0 0 100 100">
          <defs>
            <path id="circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
          </defs>
          <text fill="currentColor" fontSize="9.4" letterSpacing="2.6" fontFamily="var(--font-mono)">
            <textPath href="#circle">AVAILABLE FOR WORK • DESIGN + QA • </textPath>
          </text>
        </svg>
        <b />
      </motion.div>

      <motion.h1 className="hero__name" style={{ y: nameY, opacity: fade }}>
        <span className="sr-only">Salman Sadiq</span>
        <Line text="Salman" delay={0.1} ready={ready} />
        <Line text="Sadiq" delay={0.3} ready={ready} className="hero__line--indent" />
      </motion.h1>

      <motion.div
        className="hero__meta"
        initial={{ opacity: 0, y: 30 }}
        animate={ready ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1, ease, delay: 0.8 }}
        style={{ opacity: fade }}
      >
        <p className="hero__intro">
          Six years crafting <strong>brands, campaigns and editorial systems</strong> — and making sure the products behind
          them actually work. Currently at <strong>Kakushin</strong>, Rawalpindi.
        </p>
        <div className="hero__role">
          Graphic design meets
          <span className="swap">
            <AnimatePresence initial={false}>
              <motion.span
                key={role}
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.6, ease }}
                className="serif"
              >
                {roles[role]}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <a href="#work" className="hero__scroll">
          <i /> Scroll
        </a>
      </motion.div>
    </section>
  );
}
