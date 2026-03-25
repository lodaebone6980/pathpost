"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, BookmarkPlus } from "lucide-react";
import type { Paper } from "@/types/paper";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    await fetchPapers(1);
  }

  async function fetchPapers(pageNum: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, page: pageNum }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setPapers(data.papers);
      setTotal(data.total);
      setPage(pageNum);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "검색에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">논문 검색</h2>
        <p className="text-muted-foreground mt-1">PubMed에서 의료 논문을 검색합니다</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="검색어를 입력하세요 (예: diabetes treatment)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-1" /> 검색
            </Button>
          </form>
        </CardContent>
      </Card>

      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          총 {total.toLocaleString()}건 중 {papers.length}건 표시
        </p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {papers.map((paper) => (
          <Card key={paper.pmid}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug">{paper.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 && ` 외 ${paper.authors.length - 3}명`}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{paper.journal}</Badge>
                <Badge variant="secondary">{paper.year}</Badge>
                <Badge variant="outline">PMID: {paper.pmid}</Badge>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => {
                  toast.info("인용 기능은 에디터에서 사용할 수 있습니다");
                }}>
                  <BookmarkPlus className="h-4 w-4 mr-1" /> 인용
                </Button>
                {paper.doi && (
                  <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" /> DOI
                    </Button>
                  </a>
                )}
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" /> PubMed
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 10 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchPapers(page - 1)}
            disabled={page <= 1 || loading}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {Math.ceil(total / 10)}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchPapers(page + 1)}
            disabled={page >= Math.ceil(total / 10) || loading}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
