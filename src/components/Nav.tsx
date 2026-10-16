import Link from "next/link";

const links = [
  { href: "/#work", label: "Work" },
  { href: "/#catalog", label: "Catalog" },
  { href: "/#qa", label: "QA" },
  { href: "/#experience", label: "Experience" },
];

export default function Nav() {
  return (
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
      <Link href="/#contact" className="nav__cta">
        Let&apos;s talk
      </Link>
    </header>
  );
}
