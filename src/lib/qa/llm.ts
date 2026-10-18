// Provider-agnostic client for any OpenAI-compatible chat endpoint.
// Default: Google Gemini (free tier, reads screenshots). Swap with env vars, e.g.
//   Groq:       LLM_BASE_URL=https://api.groq.com/openai/v1      LLM_MODEL=<a Groq vision model>
//   OpenRouter: LLM_BASE_URL=https://openrouter.ai/api/v1        LLM_MODEL=<a ":free" vision model>
const BASE_URL = (process.env.LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, "");
const IS_GEMINI = BASE_URL.includes("generativelanguage.googleapis.com");
// Free-tier quotas are per model, so a lighter fallback model keeps runs going when the main one is limited.
const MODELS = [
  process.env.LLM_MODEL || "gemini-flash-latest",
  process.env.LLM_FALLBACK_MODEL ?? (IS_GEMINI ? "gemini-flash-lite-latest" : ""),
].filter(Boolean);
const MIN_INTERVAL = Number(process.env.LLM_MIN_INTERVAL_MS || 4000);

export const llmConfigured = () => !!process.env.LLM_API_KEY;

type Content = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
export type ChatMessage = { role: "system" | "user" | "assistant"; content: Content };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
// When a model is rate-limited or overloaded, skip it until this time.
const benchedUntil = new Map<string, number>();

/** Sends a chat request and parses a JSON object out of the reply. Throttled, retried and falls back across models. */
export async function chatJson<T>(messages: ChatMessage[], { maxTokens = 1200, deadline, temperature = 0.2 }: { maxTokens?: number; deadline?: number; temperature?: number } = {}): Promise<T> {
  const limit = deadline ?? Date.now() + 25000;
  let lastError = "LLM unavailable";
  for (let attempt = 0; attempt < 6; attempt++) {
    const model = MODELS.find((m) => (benchedUntil.get(m) ?? 0) < Date.now());
    if (!model) {
      // Every model is benched: wait for the soonest one, if the run has time for it.
      const soonest = Math.min(...MODELS.map((m) => benchedUntil.get(m) ?? 0));
      if (soonest > limit) break;
      await sleep(soonest - Date.now());
      continue;
    }
    const wait = lastCall + MIN_INTERVAL - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_API_KEY}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, response_format: { type: "json_object" } }),
        signal: AbortSignal.timeout(Math.max(5000, Math.min(45000, limit - Date.now()))),
      });
    } catch (e) {
      lastError = `LLM request failed: ${(e as Error).message}`;
      benchedUntil.set(model, Date.now() + 15000);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      // Gemini says how long to wait in the body ("retryDelay": "37s"); otherwise bench the model briefly.
      const errBody = await res.text().catch(() => "");
      const hinted = Number(res.headers.get("retry-after")) || Number(errBody.match(/retry(?:Delay"?\s*:\s*"|\s+in\s+)(\d+(?:\.\d+)?)s/i)?.[1]);
      const daily = /per\s*day|PerDay/i.test(errBody);
      benchedUntil.set(model, Date.now() + (daily ? 3_600_000 : hinted ? hinted * 1000 + 1000 : 20000));
      lastError = res.status === 429 ? (daily ? "Free daily AI quota used up" : "AI rate limit reached (free tier)") : `AI model overloaded (${res.status})`;
      continue;
    }
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${(await res.text()).slice(0, 200)}`);

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return parseJson<T>(text);
  }
  throw new Error(lastError);
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("LLM returned something that isn't JSON.");
  }
}
