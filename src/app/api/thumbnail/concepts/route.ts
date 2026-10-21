import { generateConcepts, imagesConfigured, type ThumbBrief } from "@/lib/thumb/generate";
import { isHex, LAYOUTS, MOODS, NICHES, STYLES, type Layout, type Palette } from "@/lib/thumb/options";
import { makeRateLimiter } from "@/lib/thumb/rateLimit";
import { llmConfigured } from "@/lib/qa/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const limited = makeRateLimiter(10 * 60 * 1000, 6);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function readPalette(v: unknown): Palette | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  return isHex(p.bg1) && isHex(p.bg2) && isHex(p.accent) && isHex(p.text) && isHex(p.stroke)
    ? { bg1: p.bg1, bg2: p.bg2, accent: p.accent, text: p.text, stroke: p.stroke }
    : null;
}

export async function POST(req: Request) {
  if (!llmConfigured()) return Response.json({ error: "Thumbnail Lab is not configured yet (LLM_API_KEY is not set on the server)." }, { status: 503 });
  if (limited(req)) return Response.json({ error: "You've made a lot of thumbnails — take a 10-minute break and try again." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const title = str(body.title, 120);
  if (!title) return Response.json({ error: "Enter your video title." }, { status: 400 });

  const brief: ThumbBrief = {
    title,
    description: str(body.description, 1000),
    topics: str(body.topics, 200),
    niche: NICHES.includes(body.niche) ? body.niche : "Auto",
    style: STYLES.includes(body.style) ? body.style : "Modern",
    mood: MOODS.includes(body.mood) ? body.mood : "Exciting",
    colors: str(body.colors, 80),
    palette: readPalette(body.palette),
    text: str(body.text, 60),
    layout: LAYOUTS.includes(body.layout as Layout) ? (body.layout as Layout) : null,
    channel: str(body.channel, 40),
    hasPhoto: !!body.hasPhoto,
  };
  const count = Math.min(3, Math.max(1, Number(body.count) || 3));

  try {
    const concepts = await generateConcepts(brief, count);
    return Response.json({ concepts, images: imagesConfigured() });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Couldn't design thumbnails." }, { status: 502 });
  }
}
