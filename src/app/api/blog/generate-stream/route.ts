import { getSession } from "@/lib/auth/session";
import { DEFAULT_TEXT_MODEL } from "@/lib/ai/models";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      hospitalName,
      doctorName,
      personaFeatures,
      mainKeywords,
      subject,
      referenceText,
      academicText,
      contentStyle,
      targetLength,
      useWebSearch,
    } = await request.json();

    if (!mainKeywords || mainKeywords.length === 0) {
      return new Response(JSON.stringify({ error: "키워드를 입력해주세요" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === "placeholder-add-your-key") {
      return new Response(
        JSON.stringify({ error: "Gemini API 키가 설정되지 않았습니다" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const styleMap: Record<string, string> = {
      standard: "전문적이고 신뢰감 있는 어조",
      friendly: "친근하고 이해하기 쉬운 어조",
      casual: "가볍고 편안한 대화체 어조",
    };

    const systemPrompt = `당신은 한국 병원/의원의 네이버 블로그 글을 작성하는 전문 AI입니다.
실제 병원에서 환자에게 정보를 제공하는 블로그 글처럼 작성하세요.

작성 규칙:
1. 한국어로 작성 (네이버 블로그 스타일)
2. \${styleMap[contentStyle] || styleMap.standard}
3. 약 \${targetLength || 1500}자 분량
4. 의학적으로 정확한 정보만 포함
5. 자연스러운 블로그 글 구조 (도입 → 시술/치료 설명 → 효과/장점 → 주의사항 → 마무리)
6. 각 섹션에 ## 소제목 사용
7. 전문 용어는 괄호 안에 영문 표기
8. 의료 광고법 준수 (최고, 최초, 보장, 완치 등 금지 표현 절대 사용 금지)
9. 과장 없이 객관적이고 신뢰감 있게 작성
10. "~입니다", "~됩니다" 등 존댓말 사용
\${hospitalName ? "\n병원명: " + hospitalName + " (글 중간에 자연스럽게 1~2회 언급)" : ""}
\${doctorName ? "의사명: " + doctorName : ""}
\${personaFeatures ? "작성자 페르소나: " + personaFeatures : ""}`;

    let userPrompt = "키워드: " + mainKeywords.join(", ");
    if (subject) userPrompt += "\n블로그 제목/주제: " + subject;
    if (referenceText) userPrompt += "\n\n참고 자료:\n" + referenceText.slice(0, 5000);
    if (academicText) userPrompt += "\n\n논문/학술 자료:\n" + academicText.slice(0, 3000);
    userPrompt += "\n\n위 키워드를 중심으로 실제 병원 네이버 블로그에 올릴 수 있는 글을 작성해주세요.";

    const tools = useWebSearch ? [{ googleSearch: {} }] : undefined;
    const requestBody: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    };
    if (tools) requestBody.tools = tools;

    console.log("[generate-stream] Calling Gemini:", DEFAULT_TEXT_MODEL);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/\${DEFAULT_TEXT_MODEL}:streamGenerateContent?alt=sse&key=\${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-stream] Gemini error:", response.status, errText.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Gemini API 오류: " + errText.substring(0, 500) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const userId = session.sub;

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let fullContent = "";
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
                    fullContent += text;
                    controller.enqueue(encoder.encode("data: " + JSON.stringify({ text }) + "\n\n"));
                  }
                } catch { /* skip */ }
              }
            }
          }
          if (fullContent.trim()) {
            try {
              const supabase = createServerClient();
              const title = subject || mainKeywords[0] || "제목 없음";
              await supabase.from("blogs").insert({
                user_id: userId, title, content: fullContent, tags: mainKeywords, status: "draft",
              });
            } catch (dbErr) {
              console.error("[generate-stream] DB error:", dbErr);
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (streamErr) {
          console.error("[generate-stream] Stream error:", streamErr);
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ error: String(streamErr) }) + "\n\n"));
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
    console.error("[generate-stream] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "블로그 생성에 실패했습니다";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
