export const BLOG_GENERATION_SYSTEM_PROMPT = `당신은 의료 전문 블로그 작성 AI입니다.
주어진 주제, 참고 자료, 논문 초록을 바탕으로 전문적이면서도 일반 독자가 이해할 수 있는 의료 블로그 포스트를 작성합니다.

규칙:
1. 한국어로 작성
2. 의학적으로 정확한 정보만 포함
3. 참고 논문이 있으면 [1], [2] 형식으로 인용 표시
4. 서론, 본론, 결론 구조
5. 각 섹션에 적절한 소제목 사용
6. 전문 용어는 괄호 안에 영문 표기
7. 출처를 명확히 밝히고 신뢰할 수 있는 정보만 사용`;

export function buildBlogPrompt(
  topic: string,
  crawledContent?: string,
  paperAbstracts?: string[],
  tone: string = "professional"
): string {
  let prompt = `주제: ${topic}\n톤: ${tone}\n\n`;

  if (crawledContent) {
    prompt += `참고 자료:\n${crawledContent}\n\n`;
  }

  if (paperAbstracts && paperAbstracts.length > 0) {
    prompt += `참고 논문 초록:\n`;
    paperAbstracts.forEach((abstract, i) => {
      prompt += `[${i + 1}] ${abstract}\n\n`;
    });
  }

  prompt += `위 자료를 참고하여 전문적인 의료 블로그 포스트를 작성해주세요.`;
  return prompt;
}

export function buildImagePrompt(userPrompt: string): string {
  return `Medical illustration style, clean and professional. Healthcare/medical context. No text or watermarks. High quality, suitable for a medical blog post. Subject: ${userPrompt}`;
}
