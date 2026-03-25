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
    const { data: images, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "이미지 목록 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
