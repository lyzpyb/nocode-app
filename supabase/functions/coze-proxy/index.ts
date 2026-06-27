// Edge Function: coze-proxy
// CORS 代理，转发请求到 Coze 工作流 API

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-client-info",
};

const COZE_BASE = "https://v57jh75nnp.coze.site";

Deno.serve(async (req: Request) => {
  // 处理预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const COZE_TOKEN = Deno.env.get("COZE_TOKEN") ?? "";
  const authHeader = { "Authorization": `Bearer ${COZE_TOKEN}` };

  const url = new URL(req.url);
  // 路径格式: /functions/v1/coze-proxy/async_run 或 /functions/v1/coze-proxy/task/:taskId
  const pathParts = url.pathname.split("/coze-proxy");
  const subPath = pathParts[1] ?? ""; // e.g. "/async_run" or "/task/abc123"

  try {
    // ── POST /async_run ─────────────────────────────────────────────────────
    if (req.method === "POST" && subPath === "/async_run") {
      const body = await req.json();
      const cozeResp = await fetch(`${COZE_BASE}/async_run`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await cozeResp.json();
      return new Response(JSON.stringify(data), {
        status: cozeResp.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ── GET /task/:taskId ───────────────────────────────────────────────────
    const taskMatch = subPath.match(/^\/task\/(.+)$/);
    if (req.method === "GET" && taskMatch) {
      const taskId = taskMatch[1];
      const cozeResp = await fetch(`${COZE_BASE}/task/${taskId}`, {
        method: "GET",
        headers: authHeader,
      });
      const data = await cozeResp.json();
      return new Response(JSON.stringify(data), {
        status: cozeResp.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown path: ${subPath}` }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
