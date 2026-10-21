import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import LogoMark from "./LogoMark";

const links = [
  { href: "/#work", label: "Work" },
  { href: "/#catalog", label: "Catalog" },
  { href: "/#qa", label: "QA" },
  { href: "/qa-lab", label: "QA Lab" },
  { href: "/logo-lab", label: "Logo Lab" },
  { href: "/thumbnail-lab", label: "Thumbnails" },
  { href: "/#experience", label: "Experience" },
  { href: "/cv", label: "CV" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <>
      <header className="nav">
        <Link href="/" className="nav__logo" aria-label="Salman Sadiq — home">
          <i /> Salman Sadiq
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <span data-t={l.label}>{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav__right">
          <ThemeToggle />
          <Link href="/#contact" className="nav__cta">
            Let&apos;s talk
          </Link>
          <MobileMenu links={links} />
        </div>
      </header>
      {/* Coloured mark lives outside the difference-blended header so it keeps its colours; the <i> above reserves its space. */}
      <Link href="/" className="nav__mark" aria-hidden="true" tabIndex={-1}>
        <LogoMark />
      </Link>
    </>
  );
}
