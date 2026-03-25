import { getSession } from "@/lib/auth/session";
import { DEFAULT_TEXT_MODEL } from "@/lib/ai/models";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const {
      hospitalName,
      doctorName,
      personaFeatures,
      mainKeywords,
      subject,
      referenceText,
      contentStyle,
      targetLength,
    } = await request.json();

    if (!mainKeywords || mainKeywords.length === 0) {
      return new Response(JSON.stringify({ error: "키워드를 입력해주세요" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === "placeholder-add-your-key") {
      return new Response(JSON.stringify({ error: "Gemini API 키가 설정되지 않았습니다" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const styleMap: Record<string, string> = {
      standard: "전문적이고 신뢰감 있는 어조",
      friendly: "친근하고 이해하기 쉬운 어조",
      casual: "가볍고 편안한 대화체 어조",
    };

    const systemPrompt = `당신은 의료 블로그 전문 작성 AI입니다.
다음 규칙을 반드시 따르세요:
1. 한국어로 작성
2. ${styleMap[contentStyle] || styleMap.standard}
3. 약 ${targetLength || 1500}자 분량
4. 의학적으로 정확한 정보만 포함
5. 서론, 본론, 결론 구조로 작성
6. 각 섹션에 ## 소제목 사용
7. 전문 용어는 괄호 안에 영문 표기
${hospitalName ? `8. 병원명: ${hospitalName}` : ""}
${doctorName ? `9. 의사명: ${doctorName}` : ""}
${personaFeatures ? `10. 페르소나 특징: ${personaFeatures}` : ""}`;

    let userPrompt = `키워드: ${mainKeywords.join(", ")}`;
    if (subject) userPrompt += `\n주제: ${subject}`;
    if (referenceText) userPrompt += `\n\n참고 자료:\n${referenceText}`;
    userPrompt += `\n\n위 키워드를 중심으로 의료 블로그 포스트를 작성해주세요.`;

    // Use Gemini streaming API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_TEXT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Gemini API 오류: ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward the SSE stream
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
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
          );
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
    const message = err instanceof Error ? err.message : "블로그 생성에 실패했습니다";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
