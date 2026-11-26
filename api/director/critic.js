import { verifyAccessPin } from "../../lib/supabase/server.js";
import { evaluateSceneWithDirectorGate } from "../../lib/video-ai/director-brain.js";

export async function POST(request) {
  const auth = verifyAccessPin(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body?.frameDataUrl) {
      return Response.json({ error: "frameDataUrl wajib dikirim." }, { status: 400 });
    }
    const result = await evaluateSceneWithDirectorGate({
      frameDataUrl: body.frameDataUrl,
      blueprint: body.blueprint || null,
      scene: body.scene || {},
      topic: body.topic || "",
      runId: body.runId || null,
      sceneIndex: body.sceneIndex ?? 0,
      retryCount: body.retryCount ?? 0,
      geminiApiKey: body.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Director critic gate error:", error);
    return Response.json({ error: error.message || "Gagal menjalankan Auto-Critic Gate." }, { status: 500 });
  }
}
