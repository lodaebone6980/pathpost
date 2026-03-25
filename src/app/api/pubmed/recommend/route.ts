import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchAndFetchPapers } from "@/lib/papers/pubmed";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { keywords } = await request.json();
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: "키워드를 입력해주세요" }, { status: 400 });
    }

    const query = keywords.join(" OR ");
    const result = await searchAndFetchPapers(query, 1, 5);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "추천에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
