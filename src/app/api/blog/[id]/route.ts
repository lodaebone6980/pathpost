import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();
  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.sub)
    .single();

  if (error || !blog) {
    return NextResponse.json({ error: "블로그를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json({ blog });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();
  const supabase = createServerClient();

  const { data: blog, error } = await supabase
    .from("blogs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.sub)
    .select()
    .single();

  if (error || !blog) {
    return NextResponse.json({ error: "블로그 수정 실패" }, { status: 500 });
  }

  return NextResponse.json({ blog });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", id)
    .eq("user_id", session.sub);

  if (error) {
    return NextResponse.json({ error: "블로그 삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
