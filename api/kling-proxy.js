// CORS-safe streaming proxy for Kling AI CDN video files so <canvas> export works cleanly on Vercel

const ALLOWED_HOST_SUFFIXES = [
  "klingai.com",
  "kuaishou.com",
  "kwimgs.com",
  "ksyun.com",
  "cloudfront.net",
  "aliyuncs.com",
  "myqcloud.com"
];

function isAllowedVideoUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:") return false;
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => u.hostname === suffix || u.hostname.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const reqUrl = new URL(request.url);
    const targetUrl = reqUrl.searchParams.get("url") || "";
    if (!targetUrl || !isAllowedVideoUrl(targetUrl)) {
      return Response.json({ error: "URL video tidak valid atau tidak diizinkan." }, { status: 400 });
    }

    const upstream = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(25000)
    });

    if (!upstream.ok) {
      return Response.json({ error: `Gagal mengunduh video Kling (HTTP ${upstream.status})` }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("kling-proxy error:", error);
    return Response.json({ error: error.message || "Proxy video gagal." }, { status: 500 });
  }
}
