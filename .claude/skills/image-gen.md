---
name: image-gen
description: Gemini API를 사용하여 이미지 생성을 테스트하세요.
user_invocable: true
---

# 이미지 생성 테스트 스킬

## 실행 순서

1. 프롬프트 확인 (사용자 입력 또는 기본 테스트 프롬프트)
2. 모델 선택 확인 (기본: 나노바나나2 / gemini-3.1-flash-image-preview)
3. 개발 서버 실행 확인
4. `/api/image/generate` 엔드포인트로 POST 요청:
   ```bash
   curl -X POST http://localhost:3000/api/image/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "<prompt>", "model": "gemini-3.1-flash-image-preview"}'
   ```
5. 결과 표시:
   - 생성된 이미지 URL
   - 사용 모델
   - 생성 시간
   - Supabase Storage 저장 경로
6. 실패 시 원인 분석:
   - API 키 유효성
   - 모델 가용성
   - 프롬프트 안전 필터
   - Storage 업로드 오류
