import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// AI answer-engine crawlers are listed explicitly so they're clearly welcome (GEO).
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: AI_BOTS, allow: "/", disallow: "/api/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
