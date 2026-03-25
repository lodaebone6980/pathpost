import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateText } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { keywords, hospitalName } = await request.json();
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: "키워드를 입력해주세요" }, { status: 400 });
    }

    const prompt = `다음 키워드를 기반으로 의료 블로그 주제 5개를 추천해주세요.
키워드: ${keywords.join(", ")}
${hospitalName ? `병원: ${hospitalName}` : ""}

형식: JSON 배열로만 답변하세요.
예시: ["주제1", "주제2", "주제3", "주제4", "주제5"]
주의: JSON 배열만 출력하고, 다른 텍스트는 포함하지 마세요.`;

    const result = await generateText(prompt);
    const match = result.match(/\[[\s\S]*\]/);
    const subjects = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "주제 추천에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
