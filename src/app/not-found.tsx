import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap" style={{ minHeight: "100svh", display: "grid", placeContent: "center", textAlign: "center" }}>
      <div className="section__title">
        404 <span className="serif">lost?</span>
      </div>
      <p style={{ color: "var(--paper-dim)", marginTop: 16 }}>This page doesn&apos;t exist.</p>
      <div style={{ marginTop: 32 }}>
        <Link href="/" className="btn">
          Back home
        </Link>
      </div>
    </main>
  );
}
