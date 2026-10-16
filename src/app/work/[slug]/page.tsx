import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/data/projects";
import ProjectView from "@/components/ProjectView";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.tagline}. ${p.description}`,
    openGraph: { images: [{ url: p.shots[0].src }] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];

  return (
    <main>
      <ProjectView project={p} />
      <Link href={`/work/${next.slug}`} className="pnext wrap" data-cursor="Next">
        <small>Next project</small>
        <div>{next.name}</div>
      </Link>
    </main>
  );
}
