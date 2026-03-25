import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "프로덕션에서는 사용할 수 없습니다" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const testEmail = "test@pathpost.app";
    const testPassword = "test1234";
    const passwordHash = await hash(testPassword, 12);

    const { data: existing } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", testEmail)
      .single();

    if (existing) {
      return NextResponse.json({
        user: existing,
        password: testPassword,
        message: "테스트 유저가 이미 존재합니다",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: testEmail,
        password_hash: passwordHash,
        name: "테스트 사용자",
      })
      .select("id, email, name")
      .single();

    if (error) {
      return NextResponse.json({ error: "테스트 유저 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({
      user,
      password: testPassword,
      message: "테스트 유저가 생성되었습니다",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
