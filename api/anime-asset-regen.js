import {
  generateDualDnaHaikei,
  generateDualDnaKyara,
  generateFullScreenAnimeCutaway,
  generateFullScreenHostInScene,
  getStyleAnchorsStatus
} from "../lib/video-ai/mappa-asset-generator.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const assetType = String(body?.assetType || "haikei").toLowerCase();

    if (assetType === "kyara") {
      const result = await generateDualDnaKyara({
        phase: body?.phase || "HOOK",
        poseKey: body?.poseKey || "",
        poseHint: body?.poseHint || "",
        topic: body?.topic || "",
        geminiApiKey: body?.geminiApiKey || ""
      });
      return Response.json({ ...result, styleAnchors: getStyleAnchorsStatus() });
    }

    if (assetType === "cutaway") {
      const result = await generateFullScreenAnimeCutaway({
        subjectDescription: body?.subjectDescription || body?.sceneDescription || body?.topic || "",
        topic: body?.topic || "",
        phase: body?.phase || "JADI",
        mood: body?.mood || "dark dramatic tungsten",
        geminiApiKey: body?.geminiApiKey || ""
      });
      return Response.json({ ...result, styleAnchors: getStyleAnchorsStatus() });
    }

    if (assetType === "fullscreen_host") {
      const result = await generateFullScreenHostInScene({
        sceneDescription: body?.sceneDescription || body?.topic || "",
        phase: body?.phase || "HOOK",
        poseHint: body?.poseHint || "",
        topic: body?.topic || "",
        geminiApiKey: body?.geminiApiKey || ""
      });
      return Response.json({ ...result, styleAnchors: getStyleAnchorsStatus() });
    }

    const result = await generateDualDnaHaikei({
      sceneDescription: body?.sceneDescription || body?.narration || body?.topic || "",
      topic: body?.topic || "",
      mood: body?.mood || "dramatic moody lighting",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json({ ...result, styleAnchors: getStyleAnchorsStatus() });
  } catch (error) {
    console.error("Dual-DNA anime asset regen error:", error);
    return Response.json(
      { ok: false, fallbackRequired: true, error: error.message || "Gagal meregenerasi aset Dual-DNA." },
      { status: 500 }
    );
  }
}
