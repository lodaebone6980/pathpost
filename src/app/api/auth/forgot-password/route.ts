import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 });
    }

    // TODO: 실제 이메일 발송 구현
    // 보안상 사용자 존재 여부와 관계없이 동일한 응답
    return NextResponse.json({
      message: "비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.",
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
