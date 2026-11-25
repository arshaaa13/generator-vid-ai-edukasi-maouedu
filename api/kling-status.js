import { getKlingVideoStatus } from "../lib/maou-engine.js";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.taskId) {
      return Response.json({ error: "taskId diperlukan." }, { status: 400 });
    }
    const result = await getKlingVideoStatus({
      taskId: body.taskId,
      type: body.type || "text2video",
      klingApiKey: body.klingApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("kling-status error:", error);
    return Response.json({ error: error.message || "Gagal cek status Kling AI." }, { status: 500 });
  }
}
