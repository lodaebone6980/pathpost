import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchPaperSummaries } from "@/lib/papers/pubmed";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { pmid } = await request.json();
    if (!pmid) {
      return NextResponse.json({ error: "PMID를 입력해주세요" }, { status: 400 });
    }

    const papers = await fetchPaperSummaries([pmid]);
    if (papers.length === 0) {
      return NextResponse.json({ error: "논문을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ paper: papers[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "논문 조회에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
