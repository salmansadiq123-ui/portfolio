import type { Metadata } from "next";
import QaLab from "@/components/QaLab";

export const metadata: Metadata = {
  title: "QA Lab",
  description: "Automated QA: give a URL and test credentials, watch an AI tester work through the site on mobile and desktop, and get a PDF bug report.",
};

export default function QaLabPage() {
  return (
    <main className="section wrap" style={{ paddingTop: 140 }}>
      <div className="section__head">
        <div>
          <span className="eyebrow">QA Lab</span>
          <h1 className="section__title">
            Automated <span className="serif">QA</span>, live.
          </h1>
        </div>
        <p className="section__aside">
          Give it a URL and a test account. An AI tester drives a real browser on mobile and desktop, checks performance,
          accessibility, links and layout, and hands you a PDF bug report.
        </p>
      </div>
      <QaLab />
    </main>
  );
}
