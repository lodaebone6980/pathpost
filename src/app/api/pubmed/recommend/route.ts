import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { searchAndFetchPapers } from "@/lib/papers/pubmed";

// 한국어 시술명 → 영문 검색어 매핑
const KEYWORD_MAP: Record<string, string> = {
  "울쎄라": "ultherapy microfocused ultrasound face",
  "써마젠": "thermage radiofrequency skin tightening",
  "보톡스": "botulinum toxin cosmetic dermatology",
  "필러": "dermal filler hyaluronic acid face",
  "리프팅": "face lifting non-surgical skin tightening",
  "레이저": "laser dermatology skin treatment",
  "피코": "picosecond laser pigmentation",
  "프락셀": "fractional laser skin resurfacing",
  "스킨부스터": "skin booster rejuvenation hyaluronic",
  "쥬베룩": "polynucleotide skin rejuvenation",
  "리쥬란": "polydeoxyribonucleotide PDRN skin",
  "인모드": "inmode radiofrequency body contouring",
  "슈링크": "HIFU skin tightening ultrasound face",
  "실리프팅": "thread lift PDO face lifting",
  "여드름": "acne treatment dermatology",
  "탈모": "alopecia hair loss treatment",
  "임플란트": "dental implant",
  "치아교정": "orthodontic treatment",
  "라미네이트": "dental veneer laminate",
};

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

    // 한국어 키워드를 영문 검색어로 변환
    const searchTerms = keywords.map((kw: string) => {
      const mapped = KEYWORD_MAP[kw];
      return mapped || kw;
    });

    const query = searchTerms.join(" AND ");
    const result = await searchAndFetchPapers(query, 1, 5);

    // fallback: AND로 결과가 없으면 개별 검색
    if (result.papers.length === 0 && searchTerms.length > 1) {
      const fallbackResult = await searchAndFetchPapers(searchTerms[0], 1, 5);
      return NextResponse.json(fallbackResult);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "추천에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
