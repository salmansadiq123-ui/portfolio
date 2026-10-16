"use client";

import { useEffect, useRef, useState } from "react";

// A dot that tracks the pointer exactly and a ring that trails it.
// Any element with data-cursor="Label" expands the ring and shows the label.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.body.classList.add("has-cursor");
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let id = 0;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      setLabel(t ? t.dataset.cursor || " " : "");
    };
    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      id = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    id = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(id);
      document.body.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className={`cursor-ring${label ? " is-active" : ""}`} aria-hidden>
        <span>{label}</span>
      </div>
    </>
  );
}
