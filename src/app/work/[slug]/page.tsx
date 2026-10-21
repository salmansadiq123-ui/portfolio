import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/data/projects";
import ProjectView from "@/components/ProjectView";
import { SITE, abs, breadcrumbs, jsonLd, pageMeta } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return pageMeta({ title: p.name, description: `${p.tagline}. ${p.description}`, path: `/work/${p.slug}`, image: p.shots[0].src });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CreativeWork",
              name: p.name,
              headline: p.tagline,
              description: p.description,
              url: abs(`/work/${p.slug}`),
              image: p.shots.slice(0, 6).map((s) => abs(s.src)),
              dateCreated: p.year,
              genre: p.categories,
              creator: { "@id": `${SITE}/#person` },
            },
            breadcrumbs([{ name: "Work", path: "/#work" }, { name: p.name, path: `/work/${p.slug}` }]),
          ],
        })}
      />
      <ProjectView project={p} />
      <Link href={`/work/${next.slug}`} className="pnext wrap" data-cursor="Next">
        <small>Next project</small>
        <div>{next.name}</div>
      </Link>
    </main>
  );
}
