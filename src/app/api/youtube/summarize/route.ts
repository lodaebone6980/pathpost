import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "YouTube URL을 입력해주세요" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
      return new Response(JSON.stringify({ error: "유효한 YouTube URL이 아닙니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === "placeholder-add-your-key") {
      return new Response(JSON.stringify({ error: "API 키가 설정되지 않았습니다" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const videoId = videoIdMatch[1];

    const systemPrompt = `당신은 YouTube 영상 요약 전문가입니다.
주어진 YouTube 영상 URL의 내용을 의료 블로그 작성에 활용할 수 있도록 요약해주세요.
1. 핵심 내용 요약 (3-5줄)
2. 주요 키워드 추출
3. 블로그에 활용할 수 있는 포인트
한국어로 작성하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            parts: [{ text: `YouTube 영상 요약을 해주세요: https://www.youtube.com/watch?v=${videoId}` }],
          }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `API 오류: ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
