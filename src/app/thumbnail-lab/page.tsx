import type { Metadata } from "next";
import ThumbnailLab from "@/components/ThumbnailLab";
import LabInfo from "@/components/LabInfo";
import { getLab, pageMeta } from "@/lib/seo";

const lab = getLab("thumbnail-lab");

export const metadata: Metadata = pageMeta({ title: lab.title, description: lab.description, path: "/thumbnail-lab" });

export default function ThumbnailLabPage() {
  return (
    <main className="section wrap" style={{ paddingTop: 140 }}>
      <div className="section__head">
        <div>
          <span className="eyebrow">Thumbnail Lab</span>
          <h1 className="section__title">
            Thumbnails, in <span className="serif">4K.</span>
          </h1>
        </div>
        <p className="section__aside">
          Describe your video and pick a look. Gemini writes the hook, art-directs each concept and paints the scene; you fine-tune the text and
          colours, then download a crisp 3840×2160 thumbnail.
        </p>
      </div>
      <ThumbnailLab />
      <LabInfo lab={lab} />
    </main>
  );
}
