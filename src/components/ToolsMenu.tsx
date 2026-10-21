"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Tool = { href: string; label: string; blurb: string };

// Desktop "Tools" dropdown. The panel is portalled into <body> so it escapes the nav's
// mix-blend-mode and keeps real colours; the button stays in the blended nav like the other links.
export default function ToolsMenu({ tools }: { tools: Tool[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>(undefined);
  const pathname = usePathname();
  const active = tools.some((t) => t.href === pathname);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
  useEffect(() => setMounted(true), []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close after client-side navigation
  useEffect(() => setOpen(false), [pathname]);

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 14, left: r.left + r.width / 2 });
  }, []);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    place();
    setOpen(true);
  };
  const hide = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`nav__tools ${active ? "is-active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="tools-menu"
        // Hover already opened it for mouse users, so a pointer click only ever opens; keyboard (detail 0) toggles.
        onClick={(e) => (e.detail === 0 && open ? setOpen(false) : show())}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <span className="nav__roll">
          <span data-t="Tools">Tools</span>
        </span>
        <svg viewBox="0 0 12 12" aria-hidden>
          <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {mounted &&
        createPortal(
          <div
            ref={panel}
            id="tools-menu"
            className={`tmenu ${open ? "is-open" : ""}`}
            style={{ top: pos.top, left: pos.left }}
            inert={!open}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <span className="eyebrow">AI tools</span>
            {tools.map((t) => (
              <Link key={t.href} href={t.href} className="tmenu__item" aria-current={t.href === pathname ? "page" : undefined}>
                <b>{t.label}</b>
                <small>{t.blurb}</small>
              </Link>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
