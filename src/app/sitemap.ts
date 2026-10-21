import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { abs, labs } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: abs("/"), lastModified: now, changeFrequency: "monthly", priority: 1, images: [abs("/og.jpg")] },
    ...labs.map((l) => ({ url: abs(`/${l.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...projects.map((p) => ({
      url: abs(`/work/${p.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: p.shots.slice(0, 10).map((s) => abs(s.src)),
    })),
    { url: abs("/cv"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
