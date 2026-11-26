import { verifyAccessPin } from "../../lib/supabase/server.js";
import { ingestVtReference } from "../../lib/video-ai/director-brain.js";

export async function POST(request) {
  const auth = verifyAccessPin(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const result = await ingestVtReference({
      title: body?.title || "",
      referenceUrl: body?.referenceUrl || body?.url || "",
      sourceNotes: body?.sourceNotes || body?.notes || "",
      avgCutDurationHint: body?.avgCutDurationHint ?? null,
      thumbnailDataUrl: body?.thumbnailDataUrl || "",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Director ingest-vt error:", error);
    return Response.json({ error: error.message || "Gagal ingest referensi VT." }, { status: 500 });
  }
}
