import { verifyAccessPin } from "../../lib/supabase/server.js";
import { recordSceneFeedback } from "../../lib/video-ai/director-brain.js";

export async function POST(request) {
  const auth = verifyAccessPin(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const result = await recordSceneFeedback({
      runId: body?.runId || null,
      topic: body?.topic || "",
      sceneIndex: body?.sceneIndex ?? 0,
      sceneType: body?.sceneType || "host",
      promptUsed: body?.promptUsed || "",
      motionConfig: body?.motionConfig || {},
      criticScore: body?.criticScore ?? null,
      criticDefects: Array.isArray(body?.criticDefects) ? body.criticDefects : [],
      retryCount: body?.retryCount ?? 0,
      userRating: body?.userRating || "good",
      userNote: body?.userNote || "",
      previewDataUrl: body?.previewDataUrl || "",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Director feedback error:", error);
    return Response.json({ error: error.message || "Gagal menyimpan feedback scene." }, { status: 500 });
  }
}
