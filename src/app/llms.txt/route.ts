import { experience, profile, qaProducts } from "@/data/profile";
import { projects } from "@/data/projects";
import { abs, labs } from "@/lib/seo";

export const dynamic = "force-static";

// llms.txt (llmstxt.org): a plain-text map of the site for AI answer engines.
export function GET() {
  const current = experience[0];
  const body = `# ${profile.name}

> ${profile.name} is a ${profile.role} at ${current.company} in ${profile.location}, working on brand identities, logos, social campaigns and editorial design, and QA-testing web and mobile products. This site is the portfolio and hosts free AI design and QA tools.

- Email: ${profile.email}
- LinkedIn: ${profile.linkedin}
- Behance: ${profile.behance}

## Tools
${labs.map((l) => `- [${l.name}](${abs(`/${l.slug}`)}): ${l.description}${l.free ? " Free." : " Passcode access."}`).join("\n")}

${labs
  .map((l) => `### ${l.name} FAQ\n${l.faq.map((f) => `- **${f.q}** ${f.a}`).join("\n")}`)
  .join("\n\n")}

## Work
${projects.map((p) => `- [${p.name}](${abs(`/work/${p.slug}`)}): ${p.tagline} (${p.categories.join(", ")}, ${p.year}).`).join("\n")}

## Experience
${experience.map((e) => `- ${e.role}, ${e.company} (${e.place}), ${e.period}`).join("\n")}

## Products QA-tested
${qaProducts.map((q) => `- ${q.name} (${q.url}): ${q.kind}`).join("\n")}

## Optional
- [CV](${abs("/cv")})
- [CV PDF](${abs("/Salman-Sadiq-CV.pdf")})
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
