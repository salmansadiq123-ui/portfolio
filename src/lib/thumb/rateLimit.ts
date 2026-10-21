// The tool is public, so cap each visitor to protect the free Gemini quota. Per instance only, which is enough here.
export function makeRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return (req: Request) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return true;
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return false;
  };
}
