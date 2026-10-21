import { generateBackground, imagesConfigured } from "@/lib/thumb/generate";
import { isHex, LAYOUTS, MOODS, STYLES, type Layout } from "@/lib/thumb/options";
import { makeRateLimiter } from "@/lib/thumb/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Three images per generate, so a little over two full runs per visitor every 10 minutes.
const limited = makeRateLimiter(10 * 60 * 1000, 8);
const MAX_PHOTO_BASE64 = 1_500_000;

export async function POST(req: Request) {
  if (!imagesConfigured()) return Response.json({ error: "AI art is not configured on this server." }, { status: 503 });
  if (limited(req)) return Response.json({ error: "AI art limit reached for now — using a designed background instead." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const c = body.concept ?? {};
  const p = c.palette ?? {};
  const prompt = typeof c.imagePrompt === "string" ? c.imagePrompt.trim().slice(0, 1200) : "";
  if (!prompt) return Response.json({ error: "Missing image prompt." }, { status: 400 });

  let photo: { mime: string; data: string } | null = null;
  if (typeof body.photo === "string" && body.photo) {
    const m = body.photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m || m[2].length > MAX_PHOTO_BASE64) return Response.json({ error: "Photo must be a JPEG, PNG or WebP under ~1 MB." }, { status: 400 });
    photo = { mime: m[1], data: m[2] };
  }

  const result = await generateBackground({
    concept: {
      imagePrompt: prompt,
      layout: LAYOUTS.includes(c.layout as Layout) ? (c.layout as Layout) : "left",
      palette: {
        bg1: isHex(p.bg1) ? p.bg1 : "#111111",
        bg2: isHex(p.bg2) ? p.bg2 : "#333333",
        accent: isHex(p.accent) ? p.accent : "#facc15",
        text: isHex(p.text) ? p.text : "#ffffff",
        stroke: isHex(p.stroke) ? p.stroke : "#000000",
      },
    },
    style: STYLES.includes(body.style) ? body.style : "Modern",
    mood: MOODS.includes(body.mood) ? body.mood : "Exciting",
    photo,
  });

  // An { error } here (usually no free image quota) isn't a server fault: the client falls back to a designed background.
  return Response.json(result);
}
