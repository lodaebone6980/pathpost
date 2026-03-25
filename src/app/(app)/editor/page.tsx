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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedPage } from "@/components/animations";
import {
  Save, Send, Wand2, X, Plus, FileText, Upload,
  Loader2, Copy, Hospital, User, Tags, Type,
  Globe, Video, BookOpen, Lightbulb, AlertTriangle,
  Search, CheckCircle, RotateCcw,
} from "lucide-react";
import type { Paper } from "@/types/paper";
import { checkCompliance, type ComplianceViolation } from "@/lib/compliance";

// ─── PubMed Panel ────────────────────────────────────────
function PubMedPanel({
  keywords,
  onSelectPaper,
}: {
  keywords: string[];
  onSelectPaper: (text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPmids, setSelectedPmids] = useState<Set<string>>(new Set());

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pubmed/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, pageSize: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommend() {
    if (keywords.length === 0) {
      toast.error("키워드를 먼저 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pubmed/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers);
      }
    } finally {
      setLoading(false);
    }
  }

  function togglePaper(paper: Paper) {
    const newSet = new Set(selectedPmids);
    if (newSet.has(paper.pmid)) {
      newSet.delete(paper.pmid);
    } else {
      newSet.add(paper.pmid);
      const citation = `[${paper.title}] ${paper.authors.slice(0, 3).join(", ")}. ${paper.journal} (${paper.year}). PMID: ${paper.pmid}`;
      onSelectPaper(citation);
    }
    setSelectedPmids(newSet);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="논문 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="text-sm"
        />
        <Button size="sm" variant="outline" onClick={() => handleSearch()} disabled={loading}>
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button size="sm" variant="ghost" className="w-full text-xs" onClick={handleRecommend} disabled={loading}>
        <Lightbulb className="h-3.5 w-3.5 mr-1" /> 키워드 기반 추천
      </Button>
      {loading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {papers.map((paper) => (
          <div
            key={paper.pmid}
            onClick={() => togglePaper(paper)}
            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              selectedPmids.has(paper.pmid)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <p className="font-medium line-clamp-2 leading-snug">{paper.title}</p>
            <p className="text-muted-foreground mt-1">
              {paper.authors.slice(0, 2).join(", ")} · {paper.journal} · {paper.year}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">PMID: {paper.pmid}</Badge>
              {selectedPmids.has(paper.pmid) && (
                <CheckCircle className="h-3 w-3 text-primary ml-auto" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── YouTube Summary Dialog ──────────────────────────────
function YouTubeSummaryDialog({ onInsert }: { onInsert: (text: string) => void }) {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSummarize() {
    if (!url.trim()) return;
    setLoading(true);
    setSummary("");

    try {
      const res = await fetch("/api/youtube/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
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
              if (parsed.text) setSummary((prev) => prev + parsed.text);
            } catch { /* skip */ }
          }
        }
      }
      toast.success("요약 완료!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "요약에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <Video className="h-3.5 w-3.5 text-red-500" /> YouTube 요약
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" /> YouTube 영상 요약
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleSummarize} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "요약"}
            </Button>
          </div>
          {summary && (
            <div className="rounded-lg border p-3 max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{summary}</pre>
            </div>
          )}
          {summary && (
            <Button
              className="w-full"
              onClick={() => {
                onInsert(summary);
                setOpen(false);
                toast.success("참고 자료에 추가되었습니다");
              }}
            >
              참고 자료에 삽입
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Compliance Panel ────────────────────────────────────
function CompliancePanel({
  violations,
  onRewrite,
}: {
  violations: ComplianceViolation[];
  onRewrite: (original: string, replacement: string) => void;
}) {
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<{ text: string; confidence: number }[]>([]);

  async function handleRewrite(violation: ComplianceViolation) {
    setRewriting(violation.term);
    setAlternatives([]);

    try {
      const res = await fetch("/api/blog/rewrite-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: violation.sentence, reason: violation.reason }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlternatives(data.alternatives || []);
      }
    } finally {
      setRewriting(null);
    }
  }

  if (violations.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
        <CheckCircle className="h-4 w-4" /> 컴플라이언스 위반 사항이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
        <AlertTriangle className="h-4 w-4" /> {violations.length}건의 위반 사항이 발견되었습니다
      </div>
      {violations.map((v, i) => (
        <div key={i} className="p-2.5 rounded-lg border border-destructive/20 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="text-[10px]">{v.term}</Badge>
            <span className="text-muted-foreground">{v.reason}</span>
          </div>
          <p className="text-muted-foreground line-clamp-2">...{v.sentence}...</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7"
            onClick={() => handleRewrite(v)}
            disabled={rewriting === v.term}
          >
            {rewriting === v.term ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RotateCcw className="h-3 w-3 mr-1" />
            )}
            AI 대안 제시
          </Button>
          {alternatives.length > 0 && rewriting === null && (
            <div className="space-y-1 mt-1">
              {alternatives.map((alt, j) => (
                <div
                  key={j}
                  onClick={() => onRewrite(v.sentence, alt.text)}
                  className="p-1.5 rounded border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <p className="text-[11px]">{alt.text}</p>
                  <span className="text-[10px] text-muted-foreground">
                    적합도: {Math.round(alt.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Editor Page ────────────────────────────────────
export default function EditorPage() {
  const router = useRouter();

  // Form state
  const [hospitalName, setHospitalName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [personaFeatures, setPersonaFeatures] = useState("");
  const [mainKeywords, setMainKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [subject, setSubject] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [referenceText, setReferenceText] = useState("");
  const [thesisText, setThesisText] = useState("");
  const [contentStyle, setContentStyle] = useState("standard");
  const [targetLength, setTargetLength] = useState(1500);

  // Output state
  const [title, setTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestingSubjects, setSuggestingSubjects] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [activeTab, setActiveTab] = useState("pubmed");
  const abortRef = useRef<AbortController | null>(null);

  // ─── Keywords ──────────────────────────────────────────
  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (mainKeywords.length >= 5) {
      toast.error("키워드는 최대 5개까지 입력할 수 있습니다");
      return;
    }
    if (mainKeywords.includes(kw)) return;
    setMainKeywords([...mainKeywords, kw]);
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    setMainKeywords(mainKeywords.filter((k) => k !== kw));
  }

  // ─── Subject Suggestions ──────────────────────────────
  async function suggestSubjects() {
    if (mainKeywords.length === 0) {
      toast.error("키워드를 먼저 입력해주세요");
      return;
    }
    setSuggestingSubjects(true);
    try {
      const res = await fetch("/api/blog/suggest-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: mainKeywords, hospitalName }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedSubjects(data.subjects || []);
      }
    } catch {
      toast.error("주제 추천에 실패했습니다");
    } finally {
      setSuggestingSubjects(false);
    }
  }

  // ─── File Upload ───────────────────────────────────────
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하만 가능합니다");
      return;
    }
    if (!file.name.match(/\.(txt|pdf|docx)$/i)) {
      toast.error("txt, pdf, docx 파일만 지원합니다");
      return;
    }

    if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceText((prev) => prev + (prev ? "\n\n" : "") + (ev.target?.result as string));
        toast.success("파일이 추가되었습니다");
      };
      reader.readAsText(file);
    } else {
      toast.info("PDF/DOCX 파일은 텍스트 추출 후 붙여넣어 주세요");
    }
    e.target.value = "";
  }

  // ─── SSE Generation ────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (mainKeywords.length === 0) {
      toast.error("키워드를 최소 1개 이상 입력해주세요");
      return;
    }

    setGenerating(true);
    setGeneratedContent("");
    setViolations([]);

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
          referenceText: [referenceText, thesisText].filter(Boolean).join("\n\n---\n\n"),
          contentStyle,
          targetLength,
          useWebSearch,
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
      let fullContent = "";

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
                fullContent += parsed.text;
                setGeneratedContent(fullContent);
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      if (!title) setTitle(subject || mainKeywords[0]);

      // Run compliance check
      const compViolations = checkCompliance(fullContent);
      setViolations(compViolations);

      if (compViolations.length > 0) {
        toast.warning(`${compViolations.length}건의 컴플라이언스 위반이 발견되었습니다`);
      } else {
        toast.success("블로그 생성이 완료되었습니다!");
      }
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
  }, [hospitalName, doctorName, personaFeatures, mainKeywords, subject, referenceText, thesisText, contentStyle, targetLength, useWebSearch, title]);

  function handleStop() {
    abortRef.current?.abort();
  }

  // ─── Compliance Rewrite ────────────────────────────────
  function handleComplianceRewrite(original: string, replacement: string) {
    const updated = generatedContent.replace(original, replacement);
    setGeneratedContent(updated);
    setViolations(checkCompliance(updated));
    toast.success("문장이 수정되었습니다");
  }

  // ─── Save ──────────────────────────────────────────────
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
          content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: generatedContent }] }] },
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
    toast.success("복사되었습니다");
  }

  const wordCount = generatedContent.length;

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">블로그 작성</h2>
            <p className="text-muted-foreground mt-1">AI가 의료 블로그를 작성합니다</p>
          </div>
          {generatedContent && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> 임시저장
              </Button>
              <Button size="sm" onClick={() => handleSave("published")} disabled={saving}>
                <Send className="h-4 w-4 mr-1" /> 발행
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr_280px]">
          {/* ─── Left: Input Form ─── */}
          <div className="space-y-4">
            {/* Card 1: Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Hospital className="h-4 w-4 text-primary" /> 기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">병원명 *</Label>
                  <Input placeholder="OO의원" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">의사명</Label>
                  <Input placeholder="홍길동 원장" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <User className="h-3 w-3" /> 페르소나 <span className="text-muted-foreground ml-auto">{personaFeatures.length}/500</span>
                  </Label>
                  <Textarea placeholder="블로그 작성자의 성격이나 특징" value={personaFeatures} onChange={(e) => setPersonaFeatures(e.target.value.slice(0, 500))} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Keywords & Topic */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tags className="h-4 w-4 text-primary" /> 키워드 및 주제
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">메인 키워드 * (최대 5개)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter로 추가"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
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
                          <button onClick={() => removeKeyword(kw)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1"><Type className="h-3 w-3" /> 주제</Label>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={suggestSubjects} disabled={suggestingSubjects}>
                      {suggestingSubjects ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Lightbulb className="h-3 w-3 mr-1" />}
                      AI 추천
                    </Button>
                  </div>
                  <Input placeholder="구체적인 블로그 주제" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  {suggestedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {suggestedSubjects.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setSubject(s); setSuggestedSubjects([]); }}
                          className="text-[11px] px-2 py-0.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Reference + Web Search + YouTube */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> 참고 자료
                  </CardTitle>
                  <YouTubeSummaryDialog
                    onInsert={(text) => setReferenceText((prev) => prev + (prev ? "\n\n---\n\n" : "") + text)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <Globe className="h-3 w-3" /> 웹 검색 활용
                  </Label>
                  <Switch checked={useWebSearch} onCheckedChange={setUseWebSearch} />
                </div>

                <Textarea
                  placeholder="참고할 텍스트를 붙여넣으세요"
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  rows={3}
                />

                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:border-primary/50 transition-colors">
                    <Upload className="h-4 w-4" /> 파일 업로드 (.txt, .pdf, .docx / 최대 10MB)
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> 논문/학술 자료
                  </Label>
                  <Textarea
                    placeholder="논문 초록이나 학술 내용을 붙여넣으세요"
                    value={thesisText}
                    onChange={(e) => setThesisText(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Style */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">스타일 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">콘텐츠 스타일</Label>
                  <RadioGroup value={contentStyle} onValueChange={setContentStyle} className="flex gap-3">
                    {[
                      { value: "standard", label: "전문적" },
                      { value: "friendly", label: "친근한" },
                      { value: "casual", label: "캐주얼" },
                    ].map((style) => (
                      <div key={style.value} className="flex items-center space-x-1.5">
                        <RadioGroupItem value={style.value} id={style.value} />
                        <Label htmlFor={style.value} className="text-sm cursor-pointer">{style.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">목표 글자수: <span className="font-semibold text-primary">{targetLength.toLocaleString()}자</span></Label>
                  <input type="range" min={1000} max={3000} step={100} value={targetLength} onChange={(e) => setTargetLength(Number(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>1,000자</span><span>3,000자</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button onClick={generating ? handleStop : handleGenerate} className="w-full" variant={generating ? "destructive" : "default"} size="lg">
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 생성 중단</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" /> AI 블로그 생성</>
              )}
            </Button>
          </div>

          {/* ─── Center: Output ─── */}
          <Card className="min-h-[700px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">생성 결과</CardTitle>
                <div className="flex items-center gap-2">
                  {wordCount > 0 && <Badge variant="outline" className="text-xs">{wordCount.toLocaleString()}자</Badge>}
                  {generatedContent && (
                    <Button variant="ghost" size="sm" onClick={copyContent}><Copy className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 pt-4 overflow-y-auto">
              {!generatedContent && !generating && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-20">
                  <Wand2 className="h-12 w-12 mb-4 opacity-20" />
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
                    {generating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Right: Tools Panel ─── */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="pubmed" className="text-xs">논문</TabsTrigger>
                <TabsTrigger value="compliance" className="text-xs">컴플라이언스</TabsTrigger>
              </TabsList>

              <TabsContent value="pubmed">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> PubMed 논문 검색
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PubMedPanel
                      keywords={mainKeywords}
                      onSelectPaper={(text) => setThesisText((prev) => prev + (prev ? "\n\n" : "") + text)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> 컴플라이언스 체크
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedContent ? (
                      <CompliancePanel violations={violations} onRewrite={handleComplianceRewrite} />
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        블로그 생성 후 자동으로 검사됩니다
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
