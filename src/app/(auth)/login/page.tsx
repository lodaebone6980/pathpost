"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn } from "@/components/animations";
import { Sparkles, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  function validateEmail(value: string) {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("유효한 이메일 주소를 입력해주세요");
      return false;
    }
    setEmailError("");
    return true;
  }

  function validatePassword(value: string) {
    if (value && value.length < 6) {
      setPasswordError("비밀번호는 최소 6자 이상이어야 합니다");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");

    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    if (!emailValid || !passwordValid) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneralError(data.error || "이메일 또는 비밀번호를 확인해주세요.");
        return;
      }

      toast.success("로그인 성공!");
      window.location.replace(redirect);
    } catch {
      setGeneralError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    toast.info("비밀번호 재설정 이메일을 발송했습니다.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <FadeIn direction="up" duration={0.5}>
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </Link>
              </div>
              <div>
                <CardTitle className="text-2xl">패스포스트</CardTitle>
                <CardDescription className="mt-1">
                  로그인하여 블로그 작성을 시작하세요
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="이메일 주소를 입력하세요"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {emailError && (
                    <span className="text-xs text-destructive">{emailError}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      onBlur={(e) => validatePassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <span className="text-xs text-destructive">{passwordError}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      로그인 유지
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary transition-colors hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                </div>

                {generalError && (
                  <div className="text-xs text-destructive text-center">
                    {generalError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      로그인 중...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      로그인
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
