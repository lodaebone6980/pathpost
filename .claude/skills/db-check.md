---
name: db-check
description: Supabase 데이터베이스의 현재 데이터 현황을 확인하세요.
user_invocable: true
---

# DB 상태 확인 스킬

## 실행 순서

1. `.env.local`에서 Supabase URL/키 확인
2. 연결 테스트:
   ```bash
   curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
   ```
3. 테이블 목록 조회
4. 주요 테이블 행 수 확인: users, blogs, citations, generated_images, crawl_cache
5. RLS 정책 활성화 상태 확인
6. Storage 버킷 "blog-images" 존재 여부 확인
7. 상태 요약 리포트 출력
