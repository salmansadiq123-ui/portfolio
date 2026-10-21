import { chatJson } from "@/lib/qa/llm";
import { isHex, LAYOUTS, STYLE_BRIEF, STYLE_PALETTE, type Concept, type Layout, type Mood, type Niche, type Palette, type Style } from "./options";

export type ThumbBrief = {
  title: string;
  description?: string;
  topics?: string;
  niche: Niche;
  style: Style;
  mood: Mood;
  colors?: string;
  palette?: Palette | null;
  text?: string;
  layout?: Layout | null;
  channel?: string;
  hasPhoto: boolean;
};

const SYSTEM = `You are a top YouTube thumbnail designer and click-through-rate strategist.
You plan thumbnails that read instantly on a phone: one clear focal subject, 2–5 huge words, strong contrast, one emotion.
For each concept return:
- title: 2–4 word name of the direction
- rationale: one sentence on why it gets clicks
- headline: the text printed on the thumbnail, 2–5 words, punchy, never just a copy of the video title. Same language as the video title.
- highlight: one word from the headline to colour with the accent colour
- subtext: optional tiny supporting line (max 4 words) or ""
- badge: optional corner sticker like "NEW", "2026", "FREE", "#1", "100%" or ""
- emoji: one fitting emoji or ""
- layout: where the text sits — "left", "right", "center", "top" or "bottom" (the subject goes on the opposite side)
- palette: {"bg1","bg2","accent","text","stroke"} as #rrggbb; text must contrast strongly with the background, accent pops
- imagePrompt: an English prompt for an image model to paint the background artwork ONLY. Describe subject, scene, lighting, camera, colours. Leave clean, simpler space where the text goes (say which side). Absolutely no text, letters, logos or watermarks in the image.
Reply with JSON only: {"concepts":[{...}]}`;

export async function generateConcepts(brief: ThumbBrief, count: number): Promise<Concept[]> {
  const lines = [
    `Video title: ${brief.title}`,
    brief.description && `Video description: ${brief.description}`,
    brief.topics && `Topics / keywords: ${brief.topics}`,
    brief.niche !== "Auto" && `Channel niche: ${brief.niche}`,
    `Design style: ${brief.style} (${STYLE_BRIEF[brief.style]})`,
    `Emotion to trigger: ${brief.mood}`,
    brief.palette
      ? `Use this exact palette: ${JSON.stringify(brief.palette)}`
      : brief.colors
        ? `Colour preference: ${brief.colors}`
        : "Colours: choose what fits the topic and style.",
    brief.text && `The creator wants this text on the thumbnail: "${brief.text}" — use it as the headline (you may split the highlight word).`,
    brief.layout && `Put the text on the ${brief.layout}.`,
    brief.hasPhoto && "The creator will appear in the thumbnail (their photo is supplied), so leave room for a person on the opposite side of the text.",
    `Design ${count} clearly different concepts (different angle, layout and palette for each, unless a palette or layout was fixed above).`,
  ].filter(Boolean);

  const out = await chatJson<{ concepts?: Partial<Record<keyof Concept, unknown>>[] }>(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: lines.join("\n") },
    ],
    { maxTokens: 8000, temperature: 0.95, deadline: Date.now() + 45000 },
  );

  const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const fallback = STYLE_PALETTE[brief.style];

  const concepts = (out.concepts ?? [])
    .map((c): Concept | null => {
      const headline = brief.text ? brief.text.slice(0, 60) : text(c.headline, 60);
      if (!headline) return null;
      const p = (c.palette ?? {}) as Record<string, unknown>;
      const palette: Palette = brief.palette ?? {
        bg1: isHex(p.bg1) ? p.bg1 : fallback.bg1,
        bg2: isHex(p.bg2) ? p.bg2 : fallback.bg2,
        accent: isHex(p.accent) ? p.accent : fallback.accent,
        text: isHex(p.text) ? p.text : fallback.text,
        stroke: isHex(p.stroke) ? p.stroke : fallback.stroke,
      };
      const layout = brief.layout ?? (LAYOUTS.includes(c.layout as Layout) ? (c.layout as Layout) : "left");
      return {
        title: text(c.title, 40) || "Concept",
        rationale: text(c.rationale, 200),
        headline,
        highlight: text(c.highlight, 30),
        subtext: text(c.subtext, 40),
        badge: text(c.badge, 10),
        emoji: text(c.emoji, 8),
        layout,
        palette,
        imagePrompt: text(c.imagePrompt, 1200) || `${brief.title}, ${STYLE_BRIEF[brief.style]}`,
      };
    })
    .filter((c): c is Concept => !!c)
    .slice(0, count);
  if (!concepts.length) throw new Error("The AI didn't return a usable concept. Try again.");
  return concepts;
}

// ---------- Background art (Gemini image models) ----------

const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
const PREFERRED_IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];
let discovered: { at: number; models: string[] } | null = null;

/** Image-capable Gemini models this key can call: env override, else discovered from the models list (cached). */
async function imageModels(): Promise<string[]> {
  const env = process.env.THUMB_IMAGE_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  if (env?.length) return env;
  if (discovered && Date.now() - discovered.at < 6 * 3_600_000) return discovered.models;
  let found: string[] = [];
  try {
    const res = await fetch(`${GEMINI}/models?pageSize=1000`, { headers: { "x-goog-api-key": imageKey() }, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    found = ((data?.models ?? []) as { name?: string; supportedGenerationMethods?: string[] }[])
      .filter((m) => /image/i.test(m.name ?? "") && !/imagen/i.test(m.name ?? "") && m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => String(m.name).replace(/^models\//, ""));
  } catch {
    // Fall back to the known names below.
  }
  // Flash before Pro (free tier), newest first.
  found.sort((a, b) => Number(/pro/i.test(a)) - Number(/pro/i.test(b)) || b.localeCompare(a));
  const models = found.length ? found : PREFERRED_IMAGE_MODELS;
  discovered = { at: Date.now(), models };
  return models;
}
const imageKey = () => process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || "";

export const imagesConfigured = () =>
  !!imageKey() && (!!process.env.GEMINI_API_KEY || !process.env.LLM_BASE_URL || process.env.LLM_BASE_URL.includes("generativelanguage"));

// Models that answered "no free quota" are skipped for a while instead of being retried on every request.
const benchedUntil = new Map<string, number>();

const SIDE: Record<Layout, string> = {
  left: "the left half",
  right: "the right half",
  center: "the centre",
  top: "the top third",
  bottom: "the bottom third",
};
const OPPOSITE: Record<Layout, string> = { left: "right", right: "left", center: "centre, behind the text", top: "lower part", bottom: "upper part" };

export async function generateBackground(opts: {
  concept: Pick<Concept, "imagePrompt" | "layout" | "palette">;
  style: Style;
  mood: Mood;
  photo?: { mime: string; data: string } | null;
}): Promise<{ image: string; model: string; photoInScene: boolean } | { error: string }> {
  const { concept, style, mood, photo } = opts;
  const prompt = [
    `Create a 16:9 YouTube thumbnail background image. ${concept.imagePrompt}`,
    `Art direction: ${STYLE_BRIEF[style]}. Mood: ${mood.toLowerCase()}.`,
    `Colour palette to lean on: ${concept.palette.bg1}, ${concept.palette.bg2} with ${concept.palette.accent} accents.`,
    `Keep ${SIDE[concept.layout]} of the frame simpler and slightly darker so bold headline text can be placed there later; put the main subject on the ${OPPOSITE[concept.layout]}.`,
    photo &&
      `The attached photo is the video creator. Feature this exact person prominently on the ${OPPOSITE[concept.layout]} side, from the chest up, with a ${mood.toLowerCase()} expression, studio-quality lighting and a subtle rim light so they pop. Keep their face, identity and skin tone accurate.`,
    "Ultra sharp, high detail, vivid but natural, professional composition. Do NOT include any text, letters, numbers, captions, logos, UI or watermarks.",
  ]
    .filter(Boolean)
    .join("\n");

  let lastError = "AI art isn't available right now.";
  const tried: string[] = [];
  // A quota message is more useful to show than "model not found" from a later fallback.
  let quotaError = "";
  for (const model of await imageModels()) {
    if ((benchedUntil.get(model) ?? 0) > Date.now()) continue;
    const legacy = model.includes("2.0");
    const parts: unknown[] = [{ text: prompt }];
    if (photo) parts.push({ inlineData: { mimeType: photo.mime, data: photo.data } });

    let res: Response;
    try {
      res = await fetch(`${GEMINI}/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": imageKey() },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: legacy
            ? { responseModalities: ["TEXT", "IMAGE"] }
            : { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
        }),
        signal: AbortSignal.timeout(50000),
      });
    } catch (e) {
      lastError = `AI art request failed: ${(e as Error).message}`;
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      tried.push(`${model}: ${res.status} ${body.match(/"message":\s*"([^"]{0,140})/)?.[1] ?? ""}`.trim());
      if (res.status === 429) {
        const noFreeTier = /limit:\s*0\b/.test(body);
        const daily = noFreeTier || /PerDay/i.test(body);
        benchedUntil.set(model, Date.now() + (daily ? 3_600_000 : 60_000));
        lastError = quotaError = noFreeTier
          ? "AI art isn't included in this Gemini key's free tier."
          : daily
            ? "Today's free Gemini quota for AI art is used up."
            : "AI art rate limit reached — try again in a minute.";
      } else if (res.status === 404 || res.status === 400 || res.status === 403) {
        benchedUntil.set(model, Date.now() + 3_600_000);
        lastError = `AI art model unavailable (${res.status}).`;
      } else {
        lastError = `AI art error ${res.status}.`;
      }
      continue;
    }

    const data = await res.json().catch(() => null);
    const outParts: { inlineData?: { mimeType?: string; data?: string } }[] = data?.candidates?.[0]?.content?.parts ?? [];
    const img = outParts.find((p) => p.inlineData?.data)?.inlineData;
    if (img?.data) return { image: `data:${img.mimeType || "image/png"};base64,${img.data}`, model, photoInScene: !!photo };
    lastError = "The AI didn't return an image (it may have declined the prompt).";
  }
  if (tried.length) console.warn("[thumbnail] image models failed:", tried.join(" | "));
  return { error: quotaError || lastError, tried } as { error: string };
}
