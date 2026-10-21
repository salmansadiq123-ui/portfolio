import type { Metadata } from "next";
import QaLab from "@/components/QaLab";
import LabInfo from "@/components/LabInfo";
import { getLab, pageMeta } from "@/lib/seo";

const lab = getLab("qa-lab");

export const metadata: Metadata = pageMeta({ title: lab.title, description: lab.description, path: "/qa-lab" });

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
      <LabInfo lab={lab} />
    </main>
  );
}
