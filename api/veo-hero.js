import {
  isVeoHeroEnabled,
  startVeoHeroShotJob,
  pollVeoHeroShotJob
} from "../lib/video-ai/veo-hero-adapter.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body?.action === "poll" ? "poll" : "start";

    if (!isVeoHeroEnabled()) {
      return Response.json({
        ok: false,
        disabled: true,
        error: "Veo Hero-Shot Mode nonaktif (ENABLE_VEO_HERO_SHOTS=false)."
      });
    }

    if (action === "poll") {
      const result = await pollVeoHeroShotJob({
        operationName: body?.operationName || "",
        geminiApiKey: body?.geminiApiKey || ""
      });
      return Response.json(result);
    }

    const result = await startVeoHeroShotJob({
      keyframeDataUrl: body?.keyframeDataUrl || "",
      scene: body?.scene || {},
      blueprint: body?.blueprint || {},
      topic: body?.topic || "",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Veo hero-shot endpoint error:", error);
    return Response.json(
      { ok: false, error: error.message || "Gagal memproses Veo Hero-Shot Mode." },
      { status: 500 }
    );
  }
}
