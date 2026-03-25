import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { signToken } from "@/lib/auth/jwt";
import { createTokenCookie } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const token = await signToken({
    sub: session.sub,
    email: session.email,
    name: session.name,
  });

  const cookie = createTokenCookie(token);
  const response = NextResponse.json({ message: "토큰 갱신 완료" });
  response.cookies.set(cookie);
  return response;
}
