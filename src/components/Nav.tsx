import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import LogoMark from "./LogoMark";
import ToolsMenu, { type Tool } from "./ToolsMenu";

const before = [
  { href: "/#work", label: "Work" },
  { href: "/#catalog", label: "Catalog" },
  { href: "/#qa", label: "QA" },
];

const tools: Tool[] = [
  { href: "/qa-lab", label: "QA Lab", blurb: "AI website tester with PDF bug reports" },
  { href: "/logo-lab", label: "Logo Lab", blurb: "AI logo generator — SVG & PNG" },
  { href: "/thumbnail-lab", label: "Thumbnail Lab", blurb: "AI YouTube thumbnails in 4K" },
];

const after = [
  { href: "/#experience", label: "Experience" },
  { href: "/cv", label: "CV" },
  { href: "/#contact", label: "Contact" },
];

const navLink = (l: { href: string; label: string }) => (
  <Link key={l.href} href={l.href}>
    <span data-t={l.label}>{l.label}</span>
  </Link>
);

export default function Nav() {
  return (
    <>
      <header className="nav">
        <Link href="/" className="nav__logo" aria-label="Salman Sadiq — home">
          <i /> Salman Sadiq
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {before.map(navLink)}
          <ToolsMenu tools={tools} />
          {after.map(navLink)}
        </nav>
        <div className="nav__right">
          <ThemeToggle />
          <Link href="/#contact" className="nav__cta">
            Let&apos;s talk
          </Link>
          <MobileMenu links={[...before, { href: "", label: "Tools", children: tools }, ...after]} />
        </div>
      </header>
      {/* Coloured mark lives outside the difference-blended header so it keeps its colours; the <i> above reserves its space. */}
      <Link href="/" className="nav__mark" aria-hidden="true" tabIndex={-1}>
        <LogoMark />
      </Link>
    </>
  );
}
