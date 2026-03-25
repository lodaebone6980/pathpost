import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateText } from "@/lib/ai/gemini";
import { BLOG_GENERATION_SYSTEM_PROMPT, buildBlogPrompt } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { topic, crawledContent, paperAbstracts, tone } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: "주제를 입력해주세요" }, { status: 400 });
    }

    const prompt = buildBlogPrompt(topic, crawledContent, paperAbstracts, tone);
    const content = await generateText(prompt, BLOG_GENERATION_SYSTEM_PROMPT);

    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "블로그 생성에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
