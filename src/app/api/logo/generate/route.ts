import { generateLogos, STYLES, TYPES, type LogoBrief } from "@/lib/logo/generate";
import { llmConfigured } from "@/lib/qa/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The tool is public, so cap each visitor to protect the free Gemini quota. Per instance only, which is enough here.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  if (!llmConfigured()) return Response.json({ error: "Logo Lab is not configured yet (LLM_API_KEY is not set on the server)." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) return Response.json({ error: "You've made a lot of logos — take a 10-minute break and try again." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const name = str(body.name, 40);
  if (!name) return Response.json({ error: "Enter a brand name." }, { status: 400 });

  const brief: LogoBrief = {
    name,
    tagline: str(body.tagline, 60),
    about: str(body.about, 300),
    colors: str(body.colors, 80),
    style: STYLES.includes(body.style) ? body.style : "Modern",
    type: TYPES.includes(body.type) ? body.type : "Icon + name",
  };

  try {
    const logos = await generateLogos(brief, 4);
    return Response.json({ logos });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Couldn't generate logos." }, { status: 502 });
  }
}
