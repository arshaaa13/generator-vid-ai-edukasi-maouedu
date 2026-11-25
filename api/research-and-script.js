import { generateScriptFromPrompt } from "../lib/maou-engine.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = (body?.prompt || body?.topic || "").trim();
    if (!prompt) {
      return Response.json({ error: "Masukkan prompt topik terlebih dahulu." }, { status: 400 });
    }

    const result = await generateScriptFromPrompt({
      prompt,
      referenceUrl: body?.referenceUrl || "",
      geminiApiKey: body?.geminiApiKey || ""
    });

    return Response.json(result);
  } catch (error) {
    console.error("research-and-script error:", error);
    return Response.json({ error: error.message || "Gagal meriset dan membuat skrip." }, { status: 500 });
  }
}
