import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken } from "@/lib/auth/jwt";
import { createTokenCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
    }

    const passwordMatch = await compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const cookie = createTokenCookie(token, rememberMe);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set(cookie);
    return response;
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
