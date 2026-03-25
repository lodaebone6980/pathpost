import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    return NextResponse.json({ exists: !!data });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
