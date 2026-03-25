"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnimatedPage } from "@/components/animations";
import {
  Save, Send, Wand2, X, Plus, FileText,
  Loader2, Copy, Hospital, User, Tags, Type,
} from "lucide-react";

export default function EditorPage() {
  const router = useRouter();

  // Blog form state
  const [hospitalName, setHospitalName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [personaFeatures, setPersonaFeatures] = useState("");
  const [mainKeywords, setMainKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [subject, setSubject] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [contentStyle, setContentStyle] = useState("standard");
  const [targetLength, setTargetLength] = useState(1500);

  // Output state
  const [title, setTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Keyword tag management
  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (mainKeywords.length >= 5) {
      toast.error("키워드는 최대 5개까지 입력할 수 있습니다");
      return;
    }
    if (mainKeywords.includes(kw)) {
      toast.error("이미 추가된 키워드입니다");
      return;
    }
    setMainKeywords([...mainKeywords, kw]);
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    setMainKeywords(mainKeywords.filter((k) => k !== kw));
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  }

  // SSE streaming generation
  const handleGenerate = useCallback(async () => {
    if (mainKeywords.length === 0) {
      toast.error("키워드를 최소 1개 이상 입력해주세요");
      return;
    }

    setGenerating(true);
    setGeneratedContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/blog/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName,
          doctorName,
          personaFeatures,
          mainKeywords,
          subject,
          referenceText,
          contentStyle,
          targetLength,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "생성에 실패했습니다");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setGeneratedContent((prev) => prev + parsed.text);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      if (!title) setTitle(subject || mainKeywords[0]);
      toast.success("블로그 생성이 완료되었습니다!");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.info("생성이 중단되었습니다");
      } else {
        toast.error(err instanceof Error ? err.message : "생성에 실패했습니다");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [hospitalName, doctorName, personaFeatures, mainKeywords, subject, referenceText, contentStyle, targetLength, title]);

  function handleStop() {
    abortRef.current?.abort();
  }

  // Save blog
  async function handleSave(status: "draft" | "published") {
    if (!title.trim() || !generatedContent.trim()) {
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
          content: {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: generatedContent }] }],
          },
          content_html: generatedContent.replace(/\n/g, "<br>"),
          tags: mainKeywords,
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

  function copyContent() {
    navigator.clipboard.writeText(generatedContent);
    toast.success("내용이 복사되었습니다");
  }

  const wordCount = generatedContent.length;

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">블로그 작성</h2>
            <p className="text-muted-foreground mt-1">AI가 의료 블로그를 작성합니다</p>
          </div>
          {generatedContent && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> 임시저장
              </Button>
              <Button onClick={() => handleSave("published")} disabled={saving}>
                <Send className="h-4 w-4 mr-1" /> 발행
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hospital className="h-4 w-4 text-primary" /> 기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">병원명 *</Label>
                    <Input
                      placeholder="OO의원"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">의사명</Label>
                    <Input
                      placeholder="홍길동 원장"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <User className="h-3 w-3" /> 페르소나 특징
                    <span className="text-muted-foreground ml-auto">{personaFeatures.length}/500</span>
                  </Label>
                  <Textarea
                    placeholder="블로그 작성자의 성격이나 특징을 설명하세요"
                    value={personaFeatures}
                    onChange={(e) => setPersonaFeatures(e.target.value.slice(0, 500))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tags className="h-4 w-4 text-primary" /> 키워드 및 주제
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">메인 키워드 * (최대 5개)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="키워드 입력 후 Enter"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {mainKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {mainKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Type className="h-3 w-3" /> 주제 (선택)
                  </Label>
                  <Input
                    placeholder="구체적인 블로그 주제를 입력하세요"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> 참고 자료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="참고할 텍스트를 붙여넣으세요 (논문, 웹 페이지 내용 등)"
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">스타일 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">콘텐츠 스타일</Label>
                  <RadioGroup value={contentStyle} onValueChange={setContentStyle} className="flex gap-3">
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="text-sm cursor-pointer">전문적</Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="friendly" id="friendly" />
                      <Label htmlFor="friendly" className="text-sm cursor-pointer">친근한</Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="casual" id="casual" />
                      <Label htmlFor="casual" className="text-sm cursor-pointer">캐주얼</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">목표 글자수: {targetLength.toLocaleString()}자</Label>
                  <input
                    type="range"
                    min={1000}
                    max={3000}
                    step={100}
                    value={targetLength}
                    onChange={(e) => setTargetLength(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1,000자</span>
                    <span>3,000자</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generating ? handleStop : handleGenerate}
              className="w-full"
              variant={generating ? "destructive" : "default"}
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> 생성 중단
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" /> AI 블로그 생성
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <Card className="min-h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">생성 결과</CardTitle>
                  <div className="flex items-center gap-2">
                    {wordCount > 0 && (
                      <Badge variant="outline">{wordCount.toLocaleString()}자</Badge>
                    )}
                    {generatedContent && (
                      <Button variant="ghost" size="sm" onClick={copyContent}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-4">
                {!generatedContent && !generating && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-20">
                    <Wand2 className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-sm">좌측 폼을 작성하고</p>
                    <p className="text-sm">AI 블로그 생성 버튼을 클릭하세요</p>
                  </div>
                )}

                {generating && !generatedContent && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">블로그를 생성하고 있습니다...</p>
                  </div>
                )}

                {(generatedContent || generating) && (
                  <div className="space-y-4">
                    <Input
                      placeholder="블로그 제목"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0"
                    />
                    <div className="prose prose-sm max-w-none font-maruburi whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedContent}
                      {generating && (
                        <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
