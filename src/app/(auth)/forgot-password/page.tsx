"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "요청에 실패했습니다");
      }

      setSent(true);
      toast.success("비밀번호 재설정 이메일을 전송했습니다");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "요청에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
        <CardDescription>
          {sent ? "이메일을 확인해주세요" : "가입한 이메일을 입력하세요"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              비밀번호 재설정 링크를 이메일로 전송했습니다.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">로그인으로 돌아가기</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "전송 중..." : "재설정 링크 전송"}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
