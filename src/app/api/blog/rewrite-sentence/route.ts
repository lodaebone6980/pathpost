import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateText } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { sentence, reason } = await request.json();
    if (!sentence) {
      return NextResponse.json({ error: "문장을 입력해주세요" }, { status: 400 });
    }

    const prompt = `다음 문장은 의료 광고법에 위반될 수 있습니다.
위반 이유: ${reason || "의료 광고 금지 용어 포함"}

원문: "${sentence}"

이 문장을 의료 광고법을 준수하면서 같은 의미를 전달하도록 3가지 대안을 제시해주세요.

형식: JSON 배열로만 답변하세요.
[{"text": "대안 문장", "confidence": 0.9}, ...]
confidence는 0~1 사이의 적합도 점수입니다.`;

    const result = await generateText(prompt);
    const match = result.match(/\[[\s\S]*\]/);
    const alternatives = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ alternatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : "문장 수정에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
