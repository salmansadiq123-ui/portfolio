"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { getLenis } from "./SmoothScroll";

export type LightboxItem = { src: string; w: number; h: number; title: string; sub?: string };

const Arrow = ({ dir }: { dir: "l" | "r" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d={dir === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

export default function Lightbox({
  items,
  index,
  onChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onChange: (i: number | null) => void;
}) {
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") onChange((index! + 1) % items.length);
      if (e.key === "ArrowLeft") onChange((index! - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      getLenis()?.start();
    };
  }, [open, index, items.length, onChange]);

  const item = open ? items[index!] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={(e) => e.target === e.currentTarget && onChange(null)}
        >
          <div className="lightbox__bar">
            <div>
              <strong>{item.title}</strong>
              {item.sub && <span style={{ color: "var(--paper-dim)" }}> — {item.sub}</span>}
            </div>
            <button className="icon-btn" onClick={() => onChange(null)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="lightbox__stage" onClick={(e) => e.target === e.currentTarget && onChange(null)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={item.src}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: "100%", display: "grid", placeItems: "center", minHeight: 0 }}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  width={item.w}
                  height={item.h}
                  sizes="90vw"
                  style={{ maxHeight: "calc(100svh - 190px)" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="lightbox__nav">
            <button className="icon-btn" onClick={() => onChange((index! - 1 + items.length) % items.length)} aria-label="Previous">
              <Arrow dir="l" />
            </button>
            <span className="mono" style={{ fontSize: 12, color: "var(--paper-dim)" }}>
              {String(index! + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button className="icon-btn" onClick={() => onChange((index! + 1) % items.length)} aria-label="Next">
              <Arrow dir="r" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
