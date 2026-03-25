-- PathPost Initial Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  default_image_model text DEFAULT 'gemini-3.1-flash-image-preview',
  daily_image_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL,
  content_html text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags text[] DEFAULT '{}',
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Citations table
CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  pmid text,
  title text NOT NULL,
  authors text[] DEFAULT '{}',
  journal text,
  year integer,
  doi text,
  position integer DEFAULT 0
);

-- Generated images table
CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blog_id uuid REFERENCES blogs(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  model text NOT NULL DEFAULT 'gemini-3.1-flash-image-preview',
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Crawl cache table
CREATE TABLE IF NOT EXISTS crawl_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  crawled_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_citations_blog_id ON citations(blog_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_cache_url ON crawl_cache(url);
CREATE INDEX IF NOT EXISTS idx_crawl_cache_expires ON crawl_cache(expires_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own blogs" ON blogs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD citations via blog ownership" ON citations FOR ALL
  USING (EXISTS (SELECT 1 FROM blogs WHERE blogs.id = citations.blog_id AND blogs.user_id = auth.uid()));

CREATE POLICY "Users can CRUD own images" ON generated_images FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read crawl cache" ON crawl_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert crawl cache" ON crawl_cache FOR INSERT TO authenticated WITH CHECK (true);
