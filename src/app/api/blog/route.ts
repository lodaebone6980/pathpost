import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { data: blogs, error } = await supabase
      .from("blogs")
      .select("id, title, status, tags, thumbnail_url, created_at, updated_at")
      .eq("user_id", session.sub)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "블로그 목록 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ blogs });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { title, content, tags, status, thumbnail_url } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용을 입력해주세요" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: blog, error } = await supabase
      .from("blogs")
      .insert({
        user_id: session.sub,
        title,
        content,
        tags: tags || [],
        status: status || "draft",
        thumbnail_url: thumbnail_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "블로그 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({ blog }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
