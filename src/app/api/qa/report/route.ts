import { checkPasscode } from "@/lib/qa/guard";
import { buildReportPdf } from "@/lib/qa/report";
import type { RunResult } from "@/lib/qa/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const denied = checkPasscode(body.passcode);
  if (denied) return Response.json({ error: denied }, { status: 401 });

  const runs = (Array.isArray(body.runs) ? body.runs : []) as RunResult[];
  if (!runs.length || !runs.every((r) => r && typeof r.url === "string" && Array.isArray(r.findings) && Array.isArray(r.steps))) {
    return Response.json({ error: "No test results to report." }, { status: 400 });
  }

  try {
    const pdf = await buildReportPdf(runs.slice(0, 2));
    const host = new URL(runs[0].url).hostname.replace(/[^a-z0-9.-]/gi, "");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="qa-report-${host}-${new Date().toISOString().slice(0, 10)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Couldn't build the PDF." }, { status: 500 });
  }
}
