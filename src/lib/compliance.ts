// 의료 광고법 금지 용어 목록
const FORBIDDEN_TERMS = [
  { term: "최고", reason: "최상급 표현 금지" },
  { term: "최초", reason: "최상급 표현 금지" },
  { term: "유일", reason: "독점적 표현 금지" },
  { term: "100%", reason: "절대적 수치 보장 금지" },
  { term: "완치", reason: "치료 보장 표현 금지" },
  { term: "보장", reason: "치료 결과 보장 금지" },
  { term: "확실", reason: "치료 결과 보장 금지" },
  { term: "무조건", reason: "절대적 표현 금지" },
  { term: "부작용 없", reason: "부작용 없음 표현 금지" },
  { term: "통증 없", reason: "무통증 보장 금지" },
  { term: "최신", reason: "최상급 표현 주의" },
  { term: "혁신", reason: "과장 표현 주의" },
  { term: "기적", reason: "과장 표현 금지" },
  { term: "특허", reason: "특허 표현 주의 (근거 필요)" },
  { term: "독보적", reason: "독점적 표현 금지" },
  { term: "세계 최초", reason: "최상급 표현 금지" },
  { term: "국내 최초", reason: "최상급 표현 금지" },
  { term: "획기적", reason: "과장 표현 주의" },
  { term: "놀라운", reason: "과장 표현 주의" },
  { term: "저렴", reason: "가격 비교 표현 주의" },
  { term: "할인", reason: "가격 할인 표현 주의" },
  { term: "무료", reason: "무료 표현 주의" },
  { term: "이벤트", reason: "이벤트/프로모션 표현 주의" },
];

export interface ComplianceViolation {
  term: string;
  reason: string;
  index: number;
  sentence: string;
}

export function checkCompliance(content: string): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const sentences = content.split(/[.!?\n]+/).filter((s) => s.trim());

  for (const { term, reason } of FORBIDDEN_TERMS) {
    let startIndex = 0;
    let idx: number;

    while ((idx = content.indexOf(term, startIndex)) !== -1) {
      // Find the sentence containing this violation
      const beforeTerm = content.substring(0, idx);
      const sentenceStart = Math.max(
        beforeTerm.lastIndexOf(".") + 1,
        beforeTerm.lastIndexOf("!") + 1,
        beforeTerm.lastIndexOf("?") + 1,
        beforeTerm.lastIndexOf("\n") + 1,
        0
      );
      const afterTerm = content.substring(idx);
      const sentenceEnd = idx + Math.min(
        ...[
          afterTerm.indexOf("."),
          afterTerm.indexOf("!"),
          afterTerm.indexOf("?"),
          afterTerm.indexOf("\n"),
        ]
          .filter((i) => i > 0)
          .concat([afterTerm.length])
      );

      const sentence = content.substring(sentenceStart, sentenceEnd).trim();

      violations.push({
        term,
        reason,
        index: idx,
        sentence,
      });

      startIndex = idx + term.length;
    }
  }

  return violations;
}

export function highlightViolations(content: string, violations: ComplianceViolation[]): string {
  if (violations.length === 0) return content;

  // Sort violations by index (reverse to avoid offset issues)
  const sorted = [...violations].sort((a, b) => b.index - a.index);
  let highlighted = content;

  for (const v of sorted) {
    const before = highlighted.substring(0, v.index);
    const after = highlighted.substring(v.index + v.term.length);
    highlighted = `${before}<mark class="bg-destructive/20 text-destructive px-0.5 rounded cursor-pointer" data-term="${v.term}" data-reason="${v.reason}">${v.term}</mark>${after}`;
  }

  return highlighted;
}
