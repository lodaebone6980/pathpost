"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, PenSquare, Trash2 } from "lucide-react";
import type { Blog } from "@/types/blog";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/blog/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data.blog);
        } else {
          toast.error("블로그를 찾을 수 없습니다");
          router.push("/blog");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    toast.success("삭제되었습니다");
    router.push("/blog");
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="space-y-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/blog")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> 목록으로
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{blog.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(blog.created_at).toLocaleDateString("ko-KR")} 작성
              </p>
            </div>
            <div className="flex gap-2">
              <Badge>{blog.status === "published" ? "발행됨" : blog.status === "draft" ? "임시저장" : "보관됨"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none font-maruburi">
            {blog.content_html ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content_html }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(blog.content, null, 2)}
              </pre>
            )}
          </div>
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => toast.info("에디터 수정 기능 준비 중")}>
              <PenSquare className="h-4 w-4 mr-1" /> 수정
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> 삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
