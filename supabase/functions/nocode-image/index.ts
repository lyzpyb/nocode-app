// Edge Function: 图片代理转存 + Coze 工作流代理
// action=proxy        → 下载图片 URL 并上传到 Supabase Storage，返回公开 URL
// action=coze-submit  → 转发 POST 到 https://v57jh75nnp.coze.site/async_run
// action=coze-poll    → 转发 GET  到 https://v57jh75nnp.coze.site/task/{task_id}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const COZE_BASE = "https://v57jh75nnp.coze.site";
const COZE_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc0Mzg5ODNjLWQ2ZDQtNDQ3My1hM2VjLTgxOTUzYzExYzBmNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInNXb3k2WDVONVEyZWQ4NUtRdjBYWHBFbW1ma01iTmhnIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzgwNTk4OTU2LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjQ3NDczNzA1MzQ5NTQ2MDI0Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjQ3NjE0Mjg2MDI1NDU3Njk5In0.r063y2-LwhnAKdQLSBMDhZMe6B38zmxKVjAhcMtT9CnvEgvfKRixML_GYCKRE034p3zIHqx4X-EcV5jf8oFFOH0hMcseSZp6jqhYSTf2S4wSXN3IhqtsdeKmPEcg5qA9fkI1gTjmhH8teOnOcfnlKt86Dh-8IYrCSnTWbwrKY57i1B7zik74vHal_6VXnYVcXm424ePkGPCKRVP2b3WBxuDqCzMQf5omSKnRnwOqXZmgS92GG44_3acOVgmJ4QszvpXoMpnknJ6MF5cqrkNnhYdRFeeDnmOtbSb8WSA52jyUTqC32e0NmQNFOceIIVF7AybaNhz5ai2y0AXkNcwXhA";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { action, imageUrl } = body;

    // action: "generate" - 调用 Agnes 文生图 API 生成图片，下载后上传 Storage，返回公开 URL
    if (action === "generate") {
      const { prompt, model = "agnes-xl-v1", width = 768, height = 1024 } = body;
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Missing required parameter: prompt" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const agnesApiKey = Deno.env.get("AGNES_API_KEY");
      if (!agnesApiKey) {
        return new Response(
          JSON.stringify({ error: "AGNES_API_KEY not configured" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // 调用 Agnes 文生图 API
      const agnesResp = await fetch("https://agnes-gateway.sankuai.com/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${agnesApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: `${width}x${height}`,
        }),
      });

      if (!agnesResp.ok) {
        const errText = await agnesResp.text();
        return new Response(
          JSON.stringify({ error: `Agnes API 调用失败: ${agnesResp.status} ${errText}` }),
          { status: agnesResp.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const agnesData = await agnesResp.json();
      const agnesImageUrl = agnesData?.data?.[0]?.url;
      if (!agnesImageUrl) {
        return new Response(
          JSON.stringify({ error: "Agnes API 返回数据中无图片 URL", raw: agnesData }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // 下载生成的图片
      const imgResp = await fetch(agnesImageUrl);
      if (!imgResp.ok) {
        return new Response(
          JSON.stringify({ error: `下载 Agnes 图片失败: ${imgResp.status}` }),
          { status: imgResp.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const imgBuffer = await imgResp.arrayBuffer();
      const contentType = imgResp.headers.get("Content-Type") || "image/png";
      const ext = contentType.split("/")[1]?.split(";")[0] || "png";

      // 上传到 Supabase Storage
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Missing Supabase configuration" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `recreation_${timestamp}_${randomId}.${ext}`;

      const uploadResp = await fetch(
        `${supabaseUrl}/storage/v1/object/images/${fileName}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": contentType,
          },
          body: imgBuffer,
        }
      );

      if (!uploadResp.ok) {
        const uploadError = await uploadResp.text();
        return new Response(
          JSON.stringify({ error: `上传 Storage 失败: ${uploadError}` }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${fileName}`;
      return new Response(
        JSON.stringify({ imageUrl: publicUrl, url: publicUrl }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );

    // action: "proxy" - 下载图片 URL 并上传到 Storage，返回公开 URL
    } else if (action === "proxy") {
      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: "Missing required parameter: imageUrl" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // 从 Agnes CDN 下载图片（服务端无跨域限制）
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) {
        return new Response(
          JSON.stringify({ error: `下载图片失败: ${imgResp.status} ${imgResp.statusText}` }),
          { status: imgResp.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const imgBuffer = await imgResp.arrayBuffer();
      const contentType = imgResp.headers.get("Content-Type") || "image/png";
      const ext = contentType.split("/")[1]?.split(";")[0] || "png";

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `comic_${timestamp}_${randomId}.${ext}`;

      // 上传到 Supabase Storage
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Missing Supabase configuration" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const uploadResp = await fetch(
        `${supabaseUrl}/storage/v1/object/images/${fileName}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": contentType,
          },
          body: imgBuffer,
        }
      );

      if (!uploadResp.ok) {
        const uploadError = await uploadResp.text();
        return new Response(
          JSON.stringify({ error: `上传 Storage 失败: ${uploadError}` }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // 返回公开 URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${fileName}`;

      return new Response(
        JSON.stringify({ url: publicUrl }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );

    // ── action: "coze-submit" → 提交 Coze 工作流任务 ──────────────────────
    } else if (action === "coze-submit") {
      const {
        story_idea = "",
        story_prompt = "",
        character_prompt = "",
        storyboard_prompt = "",
        voice_prompt = "",
      } = body;

      const cozeResp = await fetch(`${COZE_BASE}/async_run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${COZE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story_idea, story_prompt, character_prompt, storyboard_prompt, voice_prompt }),
      });
      const data = await cozeResp.json();
      return new Response(
        JSON.stringify(data),
        { status: cozeResp.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );

    // ── action: "coze-poll" → 查询 Coze 任务状态 ───────────────────────────
    } else if (action === "coze-poll") {
      const { task_id } = body;
      if (!task_id) {
        return new Response(
          JSON.stringify({ error: "Missing required parameter: task_id" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      const cozeResp = await fetch(`${COZE_BASE}/task/${task_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${COZE_TOKEN}` },
      });
      const data = await cozeResp.json();
      return new Response(
        JSON.stringify(data),
        { status: cozeResp.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'generate', 'proxy', 'coze-submit', or 'coze-poll'" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
