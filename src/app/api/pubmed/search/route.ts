import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchAndFetchPapers } from "@/lib/papers/pubmed";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { query, page = 1, pageSize = 5 } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "검색어를 입력해주세요" }, { status: 400 });
    }

    const result = await searchAndFetchPapers(query, page, pageSize);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "검색에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
