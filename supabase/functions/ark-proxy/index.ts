// Edge Function: ark-proxy
// CORS 代理，转发前端请求到 Ark (Volcengine) API，解决浏览器跨域问题
// 支持 chat/completions 和 images/generations

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info, x-ark-key",
};

const ARK_BASE = "https://ark.cn-beijing.volces.com/api/v3";

// 不同 endpoint 的 API key
const ARK_KEYS: Record<string, string> = {
  chat: "ark-775c4542-84ea-4bf4-983e-87adc130abf2-0e803",
  images: "ark-7d45285f-7256-428d-8116-e2175751945e-597b5",
};

function getKeyForPath(subPath: string): string {
  if (subPath.startsWith("/images/")) return ARK_KEYS.images;
  return ARK_KEYS.chat;
}

Deno.serve(async (req: Request) => {
  // 处理预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/ark-proxy");
  const subPath = pathParts[1] ?? "";

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // 允许前端通过 x-ark-key header 指定自定义 key（可选）
  const customKey = req.headers.get("x-ark-key");
  const apiKey = customKey || getKeyForPath(subPath);

  try {
    const body = await req.text();
    const arkResp = await fetch(`${ARK_BASE}${subPath}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await arkResp.text();
    return new Response(data, {
      status: arkResp.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
