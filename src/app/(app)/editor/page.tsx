"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Send, Wand2 } from "lucide-react";

export default function EditorPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAIGenerate() {
    if (!aiTopic.trim()) {
      toast.error("주제를 입력해주세요");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setContent(data.content);
      if (!title) setTitle(aiTopic);
      toast.success("블로그 내용이 생성되었습니다!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "생성에 실패했습니다");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(status: "draft" | "published") {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: content }] }] },
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(status === "published" ? "발행되었습니다!" : "임시저장 되었습니다");
      router.push("/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <Input
          placeholder="블로그 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> 임시저장
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving}>
            <Send className="h-4 w-4 mr-1" /> 발행
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Editor Area */}
        <Card className="min-h-[500px]">
          <CardContent className="pt-6">
            <Textarea
              placeholder="블로그 내용을 작성하세요... (TipTap 에디터로 곧 업그레이드 예정)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[460px] resize-none border-none shadow-none focus-visible:ring-0 font-maruburi text-base leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Tabs defaultValue="ai">
            <TabsList className="w-full">
              <TabsTrigger value="ai" className="flex-1">AI 생성</TabsTrigger>
              <TabsTrigger value="papers" className="flex-1">논문</TabsTrigger>
              <TabsTrigger value="image" className="flex-1">이미지</TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="space-y-3">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <Input
                    placeholder="블로그 주제 (예: 당뇨병 관리법)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <Button
                    onClick={handleAIGenerate}
                    disabled={generating}
                    className="w-full"
                    variant="outline"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    {generating ? "생성 중..." : "AI로 블로그 생성"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="papers">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground text-center py-8">
                  논문 검색 페이지에서 논문을 검색하고 인용할 수 있습니다
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="image">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground text-center py-8">
                  이미지 생성 페이지에서 AI 이미지를 만들 수 있습니다
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
