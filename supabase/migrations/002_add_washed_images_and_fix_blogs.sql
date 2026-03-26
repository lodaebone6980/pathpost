-- PathPost Migration 002
-- washed_images 테이블 추가 + blogs.content 컬럼 text 타입 변경

-- blogs.content를 jsonb→text로 변경 (AI 스트리밍 텍스트 직접 저장)
ALTER TABLE blogs ALTER COLUMN content TYPE text USING content::text;

-- washed_images 테이블 신규 생성
CREATE TABLE IF NOT EXISTS washed_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  washed_filename text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_washed_images_user_id ON washed_images(user_id);
CREATE INDEX IF NOT EXISTS idx_washed_images_created_at ON washed_images(created_at);

ALTER TABLE washed_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own washed images" ON washed_images FOR ALL USING (auth.uid() = user_id);
