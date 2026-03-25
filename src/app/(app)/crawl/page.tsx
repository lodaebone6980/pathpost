"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Copy, FileText } from "lucide-react";
import type { CrawlResult } from "@/types/crawl";

export default function CrawlPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "크롤링에 실패했습니다");
      }

      const data = await res.json();
      setResult(data);
      toast.success(data.cached ? "캐시된 결과를 불러왔습니다" : "크롤링 완료!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "크롤링에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  function copyContent() {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success("내용이 복사되었습니다");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">URL 크롤링</h2>
        <p className="text-muted-foreground mt-1">웹 페이지에서 의료 콘텐츠를 수집합니다</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCrawl} className="flex gap-2">
            <Input
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "크롤링 중..." : "크롤링"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {result.metadata.title || "제목 없음"}
                </CardTitle>
                {result.metadata.siteName && (
                  <p className="text-sm text-muted-foreground mt-1">{result.metadata.siteName}</p>
                )}
              </div>
              <div className="flex gap-2">
                {result.cached && <Badge variant="secondary">캐시</Badge>}
                <Badge variant="outline">{result.wordCount}자</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.metadata.description && (
              <p className="text-sm text-muted-foreground border-l-2 pl-3">
                {result.metadata.description}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyContent}>
                <Copy className="h-4 w-4 mr-1" /> 복사
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                // TODO: Navigate to editor with crawled content
                toast.info("에디터 연동 준비 중입니다");
              }}>
                <FileText className="h-4 w-4 mr-1" /> 블로그 생성
              </Button>
            </div>

            <div className="rounded-md border p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-maruburi">
                {result.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
