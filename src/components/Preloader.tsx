"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getLenis } from "./SmoothScroll";

// Tiny store so the hero can start its entrance exactly when the loader leaves.
let ready = false;
const listeners = new Set<() => void>();
const markReady = () => {
  ready = true;
  listeners.forEach((l) => l());
};
export const useIntroReady = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => ready,
    () => false,
  );

export default function Preloader() {
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only play once per session so moving between pages stays snappy.
    let seen = false;
    try { seen = sessionStorage.getItem("loaded") === "1"; } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => {
        setDone(true);
        markReady();
      });
      return () => cancelAnimationFrame(id);
    }
    getLenis()?.stop();
    const start = performance.now();
    const D = 1600;
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / D);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) id = requestAnimationFrame(tick);
      else setTimeout(() => {
        setDone(true);
        markReady();
        getLenis()?.start();
        try { sessionStorage.setItem("loaded", "1"); } catch {}
      }, 250);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="preloader__top">
            <span>Salman Sadiq</span>
            <span>Portfolio ©{new Date().getFullYear()}</span>
          </div>
          <div className="preloader__count">{n}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
