// Edge Function: MiMo TTS 代理
// 调用小米 MiMo TTS 服务，返回音频 URL

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MIMO_API_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { content, voice_name = "Chloe", emotion = "" } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: content" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 获取 MiMo API Key
    const mimoApiKey = Deno.env.get("MIMO_API_KEY");
    if (!mimoApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing MIMO_API_KEY configuration" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 调用 MiMo TTS API
    const ttsResp = await fetch(MIMO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": mimoApiKey,
      },
      body: JSON.stringify({
        model: "mimo-v2.5-tts",
        messages: [
          {
            role: "user",
            content: emotion || "自然流畅的语调",
          },
          {
            role: "assistant",
            content: content,
          }
        ],
        audio: {
          format: "wav",
          voice: voice_name,
        }
      }),
    });

    if (!ttsResp.ok) {
      const errorText = await ttsResp.text();
      return new Response(
        JSON.stringify({
          error: "MiMo TTS 生成失败",
          status: ttsResp.status,
          details: errorText,
        }),
        {
          status: ttsResp.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const ttsData = await ttsResp.json();
    
    // 提取 base64 音频数据
    const audioBase64 = ttsData?.choices?.[0]?.message?.audio?.data;
    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: "MiMo TTS 返回数据格式错误，缺少音频数据", response: ttsData }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // base64 解码为 ArrayBuffer
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioArrayBuffer = bytes.buffer;

    // 上传到 Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `tts_${timestamp}_${randomId}.wav`;

    // 上传到 storage
    const uploadResp = await fetch(
      `${supabaseUrl}/storage/v1/object/tts/${fileName}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "audio/wav",
        },
        body: audioArrayBuffer,
      }
    );

    if (!uploadResp.ok) {
      const uploadError = await uploadResp.text();
      return new Response(
        JSON.stringify({
          error: "上传音频失败",
          details: uploadError,
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 生成 signed URL (有效期 1 年)
    const signedUrlResp = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/tts/${fileName}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: 31536000, // 1 year
        }),
      }
    );

    if (!signedUrlResp.ok) {
      const signError = await signedUrlResp.text();
      return new Response(
        JSON.stringify({ error: "生成访问链接失败", details: signError }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const signedData = await signedUrlResp.json();
    const signedUrl = `${supabaseUrl}/storage/v1${signedData.signedURL}`;

    return new Response(
      JSON.stringify({ url: signedUrl }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("MiMo TTS Edge Function 错误:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
