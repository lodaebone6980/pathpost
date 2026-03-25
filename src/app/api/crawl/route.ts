import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";
import { fetchPage } from "@/lib/crawl/crawler";
import { extractContent } from "@/lib/crawl/extractor";
import { sanitizeContent, countWords } from "@/lib/crawl/sanitizer";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL을 입력해주세요" }, { status: 400 });
    }

    // Check cache first
    const supabase = createServerClient();
    const { data: cached } = await supabase
      .from("crawl_cache")
      .select("*")
      .eq("url", url)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json({
        url,
        content: cached.content,
        metadata: cached.metadata,
        wordCount: countWords(cached.content),
        images: [],
        crawledAt: cached.crawled_at,
        cached: true,
      });
    }

    // Fetch and extract
    const html = await fetchPage(url);
    const { content: rawContent, metadata, images } = extractContent(html, url);
    const content = sanitizeContent(rawContent);
    const wordCount = countWords(content);

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from("crawl_cache").upsert({
      url,
      content,
      metadata,
      crawled_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "url" });

    return NextResponse.json({
      url,
      content,
      metadata,
      wordCount,
      images,
      crawledAt: new Date().toISOString(),
      cached: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "크롤링에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
