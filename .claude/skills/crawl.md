---
name: crawl
description: 사용자가 제공한 URL을 크롤링 테스트하세요.
user_invocable: true
---

# 크롤링 테스트 스킬

## 실행 순서

1. 사용자로부터 크롤링할 URL 확인
2. 개발 서버 실행 확인 (npm run dev)
3. `/api/crawl` 엔드포인트로 POST 요청:
   ```bash
   curl -X POST http://localhost:3000/api/crawl \
     -H "Content-Type: application/json" \
     -d '{"url": "<target-url>"}'
   ```
4. 결과 표시: 제목, 본문 미리보기(500자), 메타데이터, 단어수
5. 실패 시 원인 분석:
   - URL 접근 불가
   - robots.txt 차단
   - SSL/CORS 문제
   - 동적 렌더링 사이트 (SPA)
