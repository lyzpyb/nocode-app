// Edge Function: 服务器端视频合成
// 接收图片和音频 URL 列表，返回合成后的视频
// 注意：此函数需要 FFmpeg，在标准 Edge Function 中不可用
// 实际部署需要使用支持 FFmpeg 的服务器或第三方服务

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { scenes, assets } = body;

    if (!scenes || !assets || scenes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing scenes or assets" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }}
      );
    }

    // 注意：这里需要使用支持 FFmpeg 的服务器
    // 当前 Edge Function 环境不支持 FFmpeg
    // 返回提示用户使用替代方案

    return new Response(
      JSON.stringify({
        error: "服务器端合成需要 FFmpeg 支持",
        message: "请在桌面浏览器中使用 MediaRecorder 合成，或下载素材自行剪辑",
        fallback: "download_assets",
        scenes: scenes.map((s: any, i: number) => ({
          sceneNumber: s.sceneNumber,
          imageUrl: assets[i]?.imageUrl,
          audioUrl: assets[i]?.audioUrl,
          duration: assets[i]?.duration || s.duration,
        })),
      }),
      { status: 501, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }}
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }}
    );
  }
});
