import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, default_image_model, created_at")
    .eq("id", session.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
