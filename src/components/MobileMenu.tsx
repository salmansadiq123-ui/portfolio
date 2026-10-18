"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { profile } from "@/data/profile";

type NavLink = { href: string; label: string };

// Phone-only menu. Rendered into <body> so it escapes the nav's mix-blend-mode.
export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button type="button" className="nav__menu" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
        <span />
        <span />
      </button>
      {mounted &&
        createPortal(
          <div id="mobile-menu" className={`mmenu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
            <div className="mmenu__top wrap">
              <span className="eyebrow">Menu</span>
              <button type="button" className="mmenu__close" aria-label="Close menu" onClick={close}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav className="mmenu__links wrap" aria-label="Mobile">
              {links.map((l, i) => (
                <Link key={l.href} href={l.href} onClick={close} style={{ transitionDelay: `${0.04 * i + 0.05}s` }}>
                  <small className="mono">{String(i + 1).padStart(2, "0")}</small>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mmenu__foot wrap">
              <a href={`mailto:${profile.email}`} className="mmenu__mail">
                {profile.email}
              </a>
              <div className="mmenu__social">
                <a href={profile.behance} target="_blank" rel="noreferrer">
                  Behance ↗
                </a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
