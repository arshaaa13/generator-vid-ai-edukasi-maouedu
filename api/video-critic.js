import { critiqueAndRefineRenderedFrame } from "../lib/video-ai/visual-critic.js";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.frameDataUrl) {
      return Response.json(
        { error: "frameDataUrl wajib dikirim agar Gemini Vision bisa menilai hasil render." },
        { status: 400 }
      );
    }

    const result = await critiqueAndRefineRenderedFrame({
      frameDataUrl: body.frameDataUrl,
      blueprint: body.blueprint || null,
      scene: body.scene || {},
      topic: body.topic || "",
      geminiApiKey: body.geminiApiKey || ""
    });

    return Response.json(result);
  } catch (error) {
    console.error("Video critic endpoint error:", error);
    return Response.json(
      { error: error.message || "Gagal menjalankan Gemini Visual Self-Critic." },
      { status: 500 }
    );
  }
}
