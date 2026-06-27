const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let videoUrl: string | null = null;

  try {
    if (req.method === "GET") {
      // GET: url via query param ?url=xxx
      const urlObj = new URL(req.url);
      videoUrl = urlObj.searchParams.get("url");
    } else if (req.method === "POST") {
      // POST: url via request body { "url": "..." }
      const body = await req.json();
      videoUrl = body?.url ?? null;
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: url" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the video from the upstream URL
    const upstream = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VideoProxy/1.0)",
      },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          error: `Upstream fetch failed: ${upstream.status} ${upstream.statusText}`,
        }),
        {
          status: upstream.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Determine content type from upstream response, fallback to video/mp4
    const contentType =
      upstream.headers.get("Content-Type") || "video/mp4";
    const contentLength = upstream.headers.get("Content-Length");

    const responseHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    // Stream the video body directly to the client
    return new Response(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
