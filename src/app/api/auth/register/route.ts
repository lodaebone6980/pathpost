import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if user exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash, name })
      .select("id, email, name")
      .single();

    if (error) {
      return NextResponse.json({ error: "회원가입에 실패했습니다" }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
