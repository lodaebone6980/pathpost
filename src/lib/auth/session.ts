import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import type { JwtPayload } from "@/types/auth";

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function createTokenCookie(token: string, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 27 * 60; // 30 days or 27 minutes
  return {
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
