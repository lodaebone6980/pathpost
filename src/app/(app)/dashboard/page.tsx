"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ImageIcon, PenSquare, Globe } from "lucide-react";

interface Stats {
  blogCount: number;
  imageCount: number;
  draftCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, blogRes, imageRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/blog"),
          fetch("/api/image"),
        ]);

        if (userRes.ok) {
          const { user } = await userRes.json();
          setUserName(user.name);
        }

        let blogCount = 0;
        let draftCount = 0;
        if (blogRes.ok) {
          const { blogs } = await blogRes.json();
          blogCount = blogs.length;
          draftCount = blogs.filter((b: { status: string }) => b.status === "draft").length;
        }

        let imageCount = 0;
        if (imageRes.ok) {
          const { images } = await imageRes.json();
          imageCount = images.length;
        }

        setStats({ blogCount, imageCount, draftCount });
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-48" /> : `안녕하세요, ${userName}님`}
        </h2>
        <p className="text-muted-foreground mt-1">오늘도 좋은 콘텐츠를 작성해보세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 블로그</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{stats?.blogCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">임시저장</CardTitle>
            <PenSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{stats?.draftCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">생성된 이미지</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{stats?.imageCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">빠른 시작</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/editor">
              <Button size="sm" className="w-full">새 글 작성</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/crawl">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" /> URL 크롤링
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">웹 페이지에서 의료 콘텐츠를 수집하세요</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/search">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" /> 논문 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">PubMed에서 의료 논문을 검색하고 인용하세요</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/image">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> AI 이미지 생성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">나노바나나2로 의료 일러스트를 생성하세요</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
