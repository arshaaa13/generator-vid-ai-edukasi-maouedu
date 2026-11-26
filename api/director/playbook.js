import { fetchActiveDirectorContext } from "../../lib/video-ai/director-brain.js";

export async function GET() {
  try {
    const context = await fetchActiveDirectorContext();
    return Response.json({ ok: true, ...context });
  } catch (error) {
    console.error("Director playbook GET error:", error);
    return Response.json({ error: error.message || "Gagal mengambil AI Playbook." }, { status: 500 });
  }
}
