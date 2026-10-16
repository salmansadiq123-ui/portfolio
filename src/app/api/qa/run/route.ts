import { runQa } from "@/lib/qa/agent";
import { checkPasscode, validateTarget } from "@/lib/qa/guard";
import type { RunEvent, Viewport } from "@/lib/qa/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

// Streams one viewport's test run as NDJSON (one RunEvent per line).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const denied = checkPasscode(body.passcode);
  if (denied) return Response.json({ error: denied }, { status: 401 });

  const target = await validateTarget(body.url);
  if ("error" in target) return Response.json({ error: target.error }, { status: 400 });
  const viewport: Viewport = body.viewport === "mobile" ? "mobile" : "desktop";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: RunEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {}
      };
      try {
        const result = await runQa(
          {
            url: target.url.href,
            username: str(body.username, 200),
            password: str(body.password, 200),
            instructions: str(body.instructions, 1500),
            viewport,
          },
          emit,
        );
        emit({ type: "done", result });
      } catch (e) {
        emit({ type: "error", message: (e as Error).message || "Test run failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
