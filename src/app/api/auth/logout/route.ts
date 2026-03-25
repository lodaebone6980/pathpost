import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "로그아웃 되었습니다" });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
