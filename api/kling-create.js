import { createKlingVideoTask } from "../lib/maou-engine.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createKlingVideoTask({
      prompt: body?.prompt || "",
      klingApiKey: body?.klingApiKey || "",
      type: body?.type || "text2video",
      imageBase64: body?.imageBase64 || "",
      modelName: body?.modelName || "kling-v2-6",
      duration: body?.duration || "5",
      aspectRatio: body?.aspectRatio || "9:16",
      mode: body?.mode || "std"
    });
    return Response.json(result);
  } catch (error) {
    console.error("kling-create error:", error);
    return Response.json({ error: error.message || "Gagal memulai render Kling AI." }, { status: 500 });
  }
}
