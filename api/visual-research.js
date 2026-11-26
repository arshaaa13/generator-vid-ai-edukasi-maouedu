import { researchAndPlanVisualWorld } from "../lib/video-ai/visual-researcher.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const topic = String(body?.topic || body?.title || "").trim();
    const scenes = Array.isArray(body?.scenes) ? body.scenes : [];
    if (!topic && !scenes.length) {
      return Response.json(
        { error: "Topik atau daftar scene wajib dikirim untuk riset visual 3D." },
        { status: 400 }
      );
    }

    const result = await researchAndPlanVisualWorld({
      topic,
      title: body?.title || topic,
      scenes,
      geminiApiKey: body?.geminiApiKey || ""
    });

    return Response.json(result);
  } catch (error) {
    console.error("Visual research error:", error);
    return Response.json(
      { error: error.message || "Gagal meriset fondasi visual 3D." },
      { status: 500 }
    );
  }
}
