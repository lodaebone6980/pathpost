# PathPost - AI 의료 블로그 플랫폼

## 기술 스택
- Next.js 15 (App Router, Turbopack, RSC)
- TypeScript strict mode
- Tailwind CSS v4 + shadcn/ui (Radix)
- Framer Motion, Sonner
- 폰트: Pretendard (UI), Maru Buri (본문) - Naver CDN
- Auth: Custom JWT (jose, 27분 refresh)
- DB: Supabase (PostgreSQL)
- AI 텍스트: Google Gemini API (gemini-2.5-pro)
- AI 이미지: Google Gemini API (모델 선택 가능 - 나노바나나2 기본)
- 크롤링: Cheerio + node-fetch (서버사이드)
- 논문검색: PubMed E-utilities API
- 에디터: TipTap v2 (ProseMirror)
- 배포: Railway (GitHub Private 연동)

## 명령어
- `npm run dev` — 개발 서버 (Turbopack)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint
- `npm run type-check` — tsc --noEmit

## 아키텍처 규칙
1. Route groups: `(auth)` 공개, `(app)` 인증필요
2. API routes: `src/app/api/` — NextResponse.json() 반환
3. Server Components 기본, "use client" 최소화
4. DB 접근: 서버에서만 `src/lib/supabase/server.ts`
5. 모든 UI 텍스트 한국어
6. API route에서 JWT 쿠키 검증 필수
7. 이미지 업로드: Supabase Storage "blog-images" 버킷

## 환경변수
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET,
GOOGLE_AI_API_KEY (Gemini API),
NCBI_API_KEY (선택, PubMed 속도 향상)

## 파일 규칙
- 컴포넌트: PascalCase, named export
- lib/utils: camelCase, named export
- 타입: src/types/ 소문자 파일명
- API routes: GET, POST, PUT, DELETE named export

## 이미지 생성 모델
- 나노바나나2 (기본): gemini-3.1-flash-image-preview
- Gemini 2.0 Flash: gemini-2.0-flash-exp
- Gemini 2.5 Pro: gemini-2.5-pro-preview
- 사용자가 설정에서 기본 모델 변경 가능
