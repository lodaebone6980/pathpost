"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare, Trash2, Eye } from "lucide-react";

interface BlogItem {
  id: string;
  title: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "임시저장",
  published: "발행됨",
  archived: "보관됨",
};

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/blog");
        if (res.ok) {
          const data = await res.json();
          setBlogs(data.blogs);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        toast.success("블로그가 삭제되었습니다");
      }
    } catch {
      toast.error("삭제에 실패했습니다");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">블로그 관리</h2>
          <p className="text-muted-foreground mt-1">작성한 블로그를 관리합니다</p>
        </div>
        <Link href="/editor">
          <Button><PenSquare className="h-4 w-4 mr-1" /> 새 글 작성</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            아직 작성한 블로그가 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <Card key={blog.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{blog.title}</CardTitle>
                  <Badge variant={blog.status === "published" ? "default" : "secondary"}>
                    {STATUS_LABELS[blog.status] || blog.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {blog.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/blog/${blog.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(blog.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(blog.updated_at).toLocaleDateString("ko-KR")} 수정
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
