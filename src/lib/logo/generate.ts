import { chatJson } from "@/lib/qa/llm";

import { STYLES, TYPES } from "./options";

export { STYLES, TYPES };

export type LogoBrief = {
  name: string;
  tagline?: string;
  about?: string;
  style: (typeof STYLES)[number];
  type: (typeof TYPES)[number];
  colors?: string;
};

export type Logo = { title: string; concept: string; palette: string[]; svg: string };

const SYSTEM = `You are a senior brand identity designer who draws logos directly as SVG code.
Rules for every SVG:
- Root element <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">. Everything fits inside with comfortable margins.
- Use only shapes, paths, gradients and <text>. No <image>, <script>, <foreignObject>, <style>, CSS, animation, external links or event attributes.
- Text uses font-family="Helvetica, Arial, sans-serif" or "Georgia, 'Times New Roman', serif" with explicit font-size and font-weight; centre it with text-anchor="middle". Spell the brand name exactly as given.
- Fill the background with one <rect width="512" height="512"> in a colour that suits the brand.
- Draw real, thoughtful marks: a clear idea tied to the brand, balanced negative space, at most 3–4 colours, legible at small sizes. Avoid clip-art and generic swooshes.
- Keep each SVG compact (under 4000 characters). Escape & as &amp; inside text.
Reply with JSON only: {"logos":[{"title":"short name for the direction","concept":"one sentence on the idea","palette":["#hex",...],"svg":"<svg ...>...</svg>"}]}`;

export async function generateLogos(brief: LogoBrief, count: number): Promise<Logo[]> {
  const lines = [
    `Brand name: ${brief.name}`,
    brief.tagline && `Tagline: ${brief.tagline}`,
    brief.about && `What the brand does: ${brief.about}`,
    `Style: ${brief.style}`,
    `Logo type: ${brief.type}${brief.type === "Lettermark" ? " (built from the initials, name in small text below)" : ""}`,
    brief.colors ? `Colour preference: ${brief.colors}` : "Colours: choose a palette that fits the brand.",
    `Design ${count} clearly different logo directions (different concept, layout and palette for each).`,
  ].filter(Boolean);

  const out = await chatJson<{ logos?: Partial<Logo>[] }>(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: lines.join("\n") },
    ],
    { maxTokens: 16000, temperature: 0.9, deadline: Date.now() + 50000 },
  );

  const logos = (out.logos ?? [])
    .map((l) => {
      const svg = sanitizeSvg(String(l.svg ?? ""));
      if (!svg) return null;
      return {
        title: String(l.title ?? "Logo").slice(0, 60),
        concept: String(l.concept ?? "").slice(0, 240),
        palette: (Array.isArray(l.palette) ? l.palette : []).filter((c) => /^#[0-9a-f]{3,8}$/i.test(String(c))).slice(0, 5),
        svg,
      };
    })
    .filter((l): l is Logo => !!l)
    .slice(0, count);
  if (!logos.length) throw new Error("The AI didn't return a usable logo. Try again.");
  return logos;
}

/**
 * The SVG comes from a model, so strip anything active before it reaches a browser:
 * the page renders it through <img> (scripts never run there), but a downloaded .svg opened directly would.
 */
export function sanitizeSvg(raw: string): string | null {
  const start = raw.search(/<svg[\s>]/i);
  const end = raw.toLowerCase().lastIndexOf("</svg>");
  if (start < 0 || end < start) return null;
  let svg = raw.slice(start, end + 6);

  svg = svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|foreignObject|style|iframe|object|embed|image|audio|video|animate\w*|set)\b[\s\S]*?(<\/\1\s*>|\/>)/gi, "")
    .replace(/<(script|foreignObject|style|iframe|object|embed|image|audio|video|animate\w*|set)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Links may only point inside the document (gradients, defs).
    .replace(/\s(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "")
    .replace(/url\(\s*(?!['"]?#)[^)]*\)/gi, "none")
    .replace(/javascript:/gi, "");

  if (!/\sxmlns=/.test(svg.slice(0, svg.indexOf(">")))) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  // A fixed size lets the browser rasterise it to PNG.
  const open = svg.slice(0, svg.indexOf(">") + 1);
  let fixed = open.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  if (!/viewBox=/i.test(fixed)) fixed = fixed.replace(/<svg/i, '<svg viewBox="0 0 512 512"');
  fixed = fixed.replace(/<svg/i, '<svg width="512" height="512"');
  svg = fixed + svg.slice(open.length);

  return svg.length <= 30000 ? svg : null;
}
