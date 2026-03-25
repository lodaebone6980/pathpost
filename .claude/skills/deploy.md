---
name: deploy
description: 변경된 파일을 모두 커밋하고 GitHub에 push한 뒤 Railway에 배포하세요.
user_invocable: true
---

# 배포 스킬

## 실행 순서

1. `npm run type-check` — TypeScript 오류 확인
2. `npm run lint` — ESLint 검사
3. `npm run build` — 프로덕션 빌드 확인
4. `git add -A` — 변경사항 스테이징
5. 커밋 메시지 작성 (한국어, 변경 내용 요약)
6. `git push origin main` — GitHub push → Railway 자동 배포
7. 배포 결과 리포트

## 주의사항
- .env.local은 절대 커밋하지 않기
- 빌드 실패 시 push하지 않기
- Railway 환경변수 변경 필요 시 사용자에게 알리기
