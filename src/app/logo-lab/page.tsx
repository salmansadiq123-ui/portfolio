import type { Metadata } from "next";
import LogoLab from "@/components/LogoLab";

export const metadata: Metadata = {
  title: "Logo Lab",
  description: "AI logo generator: describe your brand, pick a style, and get four vector logo directions to download as SVG or PNG.",
};

export default function LogoLabPage() {
  return (
    <main className="section wrap" style={{ paddingTop: 140 }}>
      <div className="section__head">
        <div>
          <span className="eyebrow">Logo Lab</span>
          <h1 className="section__title">
            Logos, <span className="serif">drafted</span> by AI.
          </h1>
        </div>
        <p className="section__aside">
          Tell it about your brand and pick a style. Gemini sketches four logo directions as clean vector files — a fast
          starting point before the real design work.
        </p>
      </div>
      <LogoLab />
    </main>
  );
}
