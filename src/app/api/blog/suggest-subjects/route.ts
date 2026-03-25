import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// 시술 키워드별 프리셋 주제 (API 키 없이도 동작)
const PRESET_SUBJECTS: Record<string, string[]> = {
  "울쎄라": [
    "울쎄라 리프팅 효과와 지속 기간, 피부과 전문의가 알려드립니다",
    "울쎄라 vs 써마젠, 어떤 리프팅이 나에게 맞을까?",
    "울쎄라 시술 전 꼭 알아야 할 5가지 핵심 포인트",
    "울쎄라 시술 후 관리법과 주의사항 총정리",
    "30대 40대 울쎄라 리프팅, 시술 적기는 언제일까?",
  ],
  "써마젠": [
    "써마젠 4세대, 기존 써마지와 무엇이 다를까?",
    "써마젠 시술 효과와 적합한 피부 타입 알아보기",
    "써마젠 vs 울쎄라, 나에게 맞는 리프팅 선택법",
    "써마젠 시술 주기와 관리 방법 안내",
    "처짐이 고민이라면? 써마젠 리프팅 시술 가이드",
  ],
  "보톡스": [
    "보톡스 시술 부위별 효과와 지속 기간 총정리",
    "보톡스 맞기 전 알아야 할 주의사항 5가지",
    "사각턱 보톡스, 자연스러운 라인을 위한 시술 포인트",
    "보톡스 시술 주기, 너무 자주 맞으면 안 되는 이유",
    "이마 주름 보톡스, 자연스러운 결과를 위한 팁",
  ],
  "필러": [
    "필러 시술 부위별 효과와 유지 기간 안내",
    "코 필러 vs 코 성형, 장단점 비교 분석",
    "필러 시술 후 주의사항과 부기 관리법",
    "팔자주름 필러, 자연스러운 결과를 위한 포인트",
    "필러 종류별 특징과 선택 가이드",
  ],
  "여드름": [
    "여드름 흉터 치료, 피부과에서 어떻게 할까?",
    "성인 여드름의 원인과 효과적인 관리법",
    "여드름 피부 스킨케어 루틴, 전문의 추천 가이드",
    "여드름 약 복용 시 알아야 할 주의사항",
    "여드름 자국 vs 흉터, 치료법이 다릅니다",
  ],
  "탈모": [
    "탈모 초기 증상과 자가 진단법 알아보기",
    "탈모 치료제 종류와 효과, 전문의가 설명합니다",
    "여성 탈모의 원인과 치료 방법 안내",
    "탈모 예방을 위한 생활 습관 5가지",
    "두피 관리와 탈모의 관계, 제대로 알고 계신가요?",
  ],
  "임플란트": [
    "임플란트 시술 과정과 기간, 단계별 안내",
    "임플란트 수명과 관리법, 오래 사용하려면?",
    "임플란트 vs 브릿지, 어떤 것을 선택해야 할까?",
    "임플란트 시술 후 주의사항 총정리",
    "앞니 임플란트, 심미적으로 자연스러운 결과를 위해",
  ],
};

function getPresetSubjects(keywords: string[]): string[] | null {
  for (const kw of keywords) {
    const subjects = PRESET_SUBJECTS[kw];
    if (subjects) return subjects;
  }
  return null;
}

function generateGenericSubjects(keywords: string[]): string[] {
  const kw = keywords[0];
  return [
    `${kw} 시술 효과와 장점, 전문의가 알려드립니다`,
    `${kw} 시술 전 꼭 알아야 할 주의사항`,
    `${kw} 시술 후 관리법과 회복 과정 안내`,
    `${kw} 시술 비용과 적합한 대상 알아보기`,
    `${kw} 관련 자주 묻는 질문 Q&A`,
  ];
}

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

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    // Gemini API가 설정되어 있으면 AI 추천
    if (apiKey && apiKey !== "placeholder-add-your-key") {
      try {
        const { generateText } = await import("@/lib/ai/gemini");

        const prompt = `당신은 병원 마케팅 전문가입니다.
다음 시술/치료 키워드로 네이버 블로그에 올릴 수 있는 실제 병원 블로그 글 제목을 5개 추천해주세요.

키워드: ${keywords.join(", ")}
${hospitalName ? `병원명: ${hospitalName}` : ""}

추천 기준:
1. 환자가 실제로 네이버에서 검색할 만한 제목
2. "시술명 + 효과/비용/후기/주의사항/비교" 등 검색 의도 반영
3. 클릭하고 싶은 자연스러운 한국어 제목
4. 의료 광고법 준수 (최고, 최초, 보장 등 금지)
5. 20~40자 사이

형식: JSON 배열로만 답변. 다른 텍스트 없이 배열만 출력.
["제목1", "제목2", "제목3", "제목4", "제목5"]`;

        const result = await generateText(prompt);
        const match = result.match(/\[[\s\S]*?\]/);
        if (match) {
          const subjects = JSON.parse(match[0]);
          return NextResponse.json({ subjects, source: "ai" });
        }
      } catch {
        // AI 실패 시 프리셋으로 폴백
      }
    }

    // 프리셋 또는 제네릭 추천
    const preset = getPresetSubjects(keywords);
    if (preset) {
      return NextResponse.json({ subjects: preset, source: "preset" });
    }

    return NextResponse.json({
      subjects: generateGenericSubjects(keywords),
      source: "generic",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "주제 추천에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
