"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, Send, Wand2, X, Plus, FileText, Upload,
  Loader2, Copy, User, Tags,
  Globe, Video, BookOpen, Lightbulb,
  Search, CheckCircle, RotateCcw, PenLine,
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
              selectedPmids.has(paper.pmid) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <p className="font-medium line-clamp-2 leading-snug">{paper.title}</p>
            <p className="text-muted-foreground mt-1">
              {paper.authors.slice(0, 2).join(", ")} · {paper.journal} · {paper.year}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">PMID: {paper.pmid}</Badge>
              {selectedPmids.has(paper.pmid) && <CheckCircle className="h-3 w-3 text-primary ml-auto" />}
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
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Video className="h-3.5 w-3.5 text-red-500" />
          YouTube 영상 요약
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" /> YouTube 영상 요약
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} />
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
            <Button className="w-full" onClick={() => { onInsert(summary); setOpen(false); toast.success("참고 자료에 추가되었습니다"); }}>
              참고 자료에 삽입
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Editor Page ──────────────────────────────────────
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
  const [contentStyle, setContentStyle] = useState("casual");
  const [targetLength, setTargetLength] = useState(1500);

  // Output state
  const [title, setTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestingSubjects, setSuggestingSubjects] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [mobileTab, setMobileTab] = useState("input");
  const [pubmedOpen, setPubmedOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Keywords ────────────────────────────────────────────
  function addKeyword(value?: string) {
    const raw = value || keywordInput;
    const keywords = raw.split(",").map((k) => k.trim()).filter(Boolean);
    for (const kw of keywords) {
      if (mainKeywords.length >= 5) {
        toast.error("키워드는 최대 5개까지 입력할 수 있습니다");
        break;
      }
      if (!mainKeywords.includes(kw)) {
        setMainKeywords((prev) => [...prev, kw]);
      }
    }
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    setMainKeywords(mainKeywords.filter((k) => k !== kw));
  }

  // ─── Subject Suggestions ──────────────────────────────────
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

  // ─── File Upload ──────────────────────────────────────────
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
        setReferenceText(ev.target?.result as string);
        toast.success("파일 내용이 참고 텍스트로 입력되었습니다");
      };
      reader.readAsText(file);
    } else {
      toast.info("PDF/DOCX 파일은 텍스트 추출 후 붙여넣어 주세요");
    }
    e.target.value = "";
  }

  // ─── SSE Generation ──────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (mainKeywords.length === 0) {
      toast.error("키워드를 최소 1개 이상 입력해주세요");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");
    setViolations([]);
    setMobileTab("result");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/blog/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName, doctorName, personaFeatures, mainKeywords, subject,
          referenceText: [referenceText, thesisText].filter(Boolean).join("\n\n---\n\n"),
          contentStyle, targetLength, useWebSearch,
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

  // ─── Save ─────────────────────────────────────────────────
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

  function downloadTxt() {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || mainKeywords[0] || "blog") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("TXT 파일이 다운로드되었습니다");
  }

  function downloadMd() {
    const mdContent = "# " + (title || mainKeywords[0] || "블로그") + "\n\n" + generatedContent;
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || mainKeywords[0] || "blog") + ".md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("MD 파일이 다운로드되었습니다");
  }

  const wordCount = generatedContent.length;

  // ─── Form Content (shared between desktop & mobile) ───────
  const formContent = (
    <form onSubmit={(e) => { e.preventDefault(); generating ? handleStop() : handleGenerate(); }} className="space-y-6">
      {/* Card 1: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>병원과 의사 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalName">병원명 <span className="text-red-500">*</span></Label>
            <Input id="hospitalName" placeholder="예: 연세피부과의원" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctorName">의사명 <span className="text-muted-foreground text-xs">(선택사항)</span></Label>
            <Input id="doctorName" placeholder="예: 김연세 (입력 시 글에 포함됩니다)" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona">특징 (페르소나) <span className="text-muted-foreground text-xs">(선택사항)</span></Label>
            <Textarea
              id="persona"
              placeholder="예: 15년 경력 의료진, 레이저 및 리프팅 시술 경험 풍부, 편안하고 친근한 상담 스타일"
              value={personaFeatures}
              onChange={(e) => setPersonaFeatures(e.target.value.slice(0, 500))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">병원/의료진의 특징, 시술 경험, 경력, 선호하는 말투 등 ({personaFeatures.length}/500)</p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: 키워드 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>키워드 설정</CardTitle>
          <CardDescription>블로그의 주요 키워드와 전체 주제를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">주요 키워드 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="주요 키워드 입력 (예: 울쎄라, HIFU)"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addKeyword()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{mainKeywords.length}/5 태그 • Enter 또는 쉼표(,)로 추가</p>
            {mainKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mainKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">전체 주제 <span className="text-muted-foreground text-xs">(선택사항)</span></Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={suggestSubjects} disabled={suggestingSubjects}>
                {suggestingSubjects ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                AI 주제 추천
              </Button>
            </div>
            <Input id="subject" placeholder="예: 리프팅 시술의 종류와 선택 기준 (전체적인 글의 방향성)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <p className="text-xs text-muted-foreground">글 전체를 관통하는 주제나 논지를 입력하면 더 일관된 내용이 생성됩니다</p>
            {suggestedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {suggestedSubjects.map((s, i) => (
                  <button key={i} type="button" onClick={() => { setSubject(s); setSuggestedSubjects([]); }} className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: 참고 텍스트 */}
      <Card>
        <CardHeader>
          <CardTitle>참고 텍스트</CardTitle>
          <CardDescription>블로그 작성을 위한 참고 자료를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> 웹 검색으로 최신 정보 추가
              </Label>
              <p className="text-xs text-muted-foreground">메인 키워드를 기반으로 최신 의학 정보를 자동 검색합니다.</p>
            </div>
            <Switch checked={useWebSearch} onCheckedChange={setUseWebSearch} />
          </div>
          <YouTubeSummaryDialog onInsert={(text) => setReferenceText((prev) => prev + (prev ? "\n\n---\n\n" : "") + text)} />
          <div className="space-y-2">
            <Label htmlFor="referenceText">참고 텍스트</Label>
            <div className="relative border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary"); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary"); const file = e.dataTransfer.files[0]; if (file) { const input = fileInputRef.current; if (input) { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true })); } } }}
            >
              <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground mt-1">.docx, .pdf, .txt 파일 지원 (최대 10MB)</p>
            </div>
            <Textarea id="referenceText" placeholder="블로그 작성을 위한 참고 텍스트를 입력하거나 파일을 업로드하세요..." value={referenceText} onChange={(e) => setReferenceText(e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: 학술 자료 */}
      <Card>
        <CardHeader>
          <CardTitle>학술 자료</CardTitle>
          <CardDescription>논문이나 학술 자료를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thesisText">논문 텍스트 <span className="text-muted-foreground text-xs">(선택사항)</span></Label>
            <Textarea id="thesisText" placeholder="의학 논문이나 학술 자료를 입력하세요..." value={thesisText} onChange={(e) => setThesisText(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground">의학 논문이나 학술 자료를 입력하면 더 전문적인 내용이 생성됩니다</p>
          </div>
          <Dialog open={pubmedOpen} onOpenChange={setPubmedOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full gap-2">
                <BookOpen className="h-4 w-4" /> 논문 검색
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> PubMed 논문 검색
                </DialogTitle>
              </DialogHeader>
              <PubMedPanel keywords={mainKeywords} onSelectPaper={(text) => { setThesisText((prev) => prev + (prev ? "\n\n" : "") + text); toast.success("논문이 학술 자료에 추가되었습니다"); }} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Card 5: 스타일 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>스타일 설정</CardTitle>
          <CardDescription>콘텐츠 스타일과 글자수를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>콘텐츠 스타일</Label>
            <RadioGroup value={contentStyle} onValueChange={setContentStyle} className="space-y-2">
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "standard" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="standard" id="style-standard" />
                <div>
                  <p className="text-sm font-medium">표준 (Standard)</p>
                  <p className="text-xs text-muted-foreground">- 전문적이고 명확한 설명</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "friendly" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="friendly" id="style-friendly" />
                <div>
                  <p className="text-sm font-medium">친근함 (Friendly)</p>
                  <p className="text-xs text-muted-foreground">- 따뜻하고 친근한 톤</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "casual" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="casual" id="style-casual" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">캐주얼 (Casual)</p>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">추천</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">- 대화하듯 부드럽게 이어지는 문장 스타일</p>
                </div>
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>목표 글자수</Label>
              <span className="text-sm font-semibold text-primary">{targetLength.toLocaleString()}자</span>
            </div>
            <input type="range" min={500} max={3000} step={100} value={targetLength} onChange={(e) => setTargetLength(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex items-center justify-between">
              <Input type="number" value={targetLength} onChange={(e) => setTargetLength(Math.min(3000, Math.max(500, Number(e.target.value))))} className="w-24 h-8 text-sm" />
            </div>
            <p className="text-xs text-muted-foreground">권장: 1500자 (±10% 범위 내에서 생성됩니다)</p>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button type="submit" className="w-full" variant={generating ? "destructive" : "default"} size="lg">
        {generating ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> 생성 중단</>) : (<><Wand2 className="h-4 w-4 mr-2" /> 블로그 생성</>)}
      </Button>
    </form>
  );

  // ─── Result Content ───────────────────────────────────────
  const resultContent = (
    <div className="min-h-[600px] flex flex-col">
      {!generatedContent && !generating && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-20">
          <Wand2 className="h-16 w-16 mb-6 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">블로그를 생성해보세요</h3>
          <p className="text-sm max-w-sm">좌측 폼을 작성하고 &apos;블로그 생성&apos; 버튼을 클릭하면 AI가 전문적인 블로그 글을 작성해드립니다.</p>
        </div>
      )}
      {generating && !generatedContent && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">블로그를 생성하고 있습니다...</p>
        </div>
      )}
      {(generatedContent || generating) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Input placeholder="블로그 제목" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 flex-1" />
            {wordCount > 0 && <Badge variant="outline" className="text-xs">{wordCount.toLocaleString()}자</Badge>}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {generatedContent}
            {generating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
          </div>
          {generatedContent && !generating && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={copyContent}><Copy className="h-4 w-4 mr-1" /> 복사</Button>
              <Button variant="outline" size="sm" onClick={downloadTxt}><FileText className="h-4 w-4 mr-1" /> TXT</Button>
              <Button variant="outline" size="sm" onClick={downloadMd}><FileText className="h-4 w-4 mr-1" /> MD</Button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving}><Save className="h-4 w-4 mr-1" /> 임시저장</Button>
                <Button size="sm" onClick={() => handleSave("published")} disabled={saving}><Send className="h-4 w-4 mr-1" /> 발행</Button>
              </div>
            </div>
          )}
          {violations.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {violations.length}건의 컴플라이언스 위반 사항이 발견되었습니다. 수정을 권장합니다.
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PenLine className="h-6 w-6" /> AI 블로그 작성
        </h2>
        <p className="text-muted-foreground mt-1">의료법을 준수하는 전문 블로그 콘텐츠를 AI로 자동 생성합니다.</p>
      </div>
      <div className="hidden lg:grid lg:grid-cols-[minmax(400px,500px)_1fr] gap-6">
        <div className="overflow-y-auto max-h-[calc(100vh-160px)] pr-2">{formContent}</div>
        <Card className="overflow-y-auto max-h-[calc(100vh-160px)]">
          <CardContent className="pt-6">{resultContent}</CardContent>
        </Card>
      </div>
      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="input">입력</TabsTrigger>
            <TabsTrigger value="result">결과</TabsTrigger>
          </TabsList>
          <TabsContent value="input">{formContent}</TabsContent>
          <TabsContent value="result">
            <Card><CardContent className="pt-6">{resultContent}</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
