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

// âââ PubMed Panel ââââââââââââââââââââââââââââââââââââââââ
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
      toast.error("í¤ìëë¥¼ ë¨¼ì  ìë ¥í´ì£¼ì¸ì");
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
          placeholder="ë¼ë¬¸ ê²ì..."
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
        <Lightbulb className="h-3.5 w-3.5 mr-1" /> í¤ìë ê¸°ë° ì¶ì²
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
              {paper.authors.slice(0, 2).join(", ")} Â· {paper.journal} Â· {paper.year}
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

// âââ YouTube Summary Dialog ââââââââââââââââââââââââââââââ
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
      toast.success("ìì½ ìë£!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ìì½ì ì¤í¨íìµëë¤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-sm font-medium">
          <Video className="h-3.5 w-3.5 text-red-500" />
          YouTube ìì ìì½
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" /> YouTube ìì ìì½
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button onClick={handleSummarize} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ìì½"}
            </Button>
          </div>
          {summary && (
            <div className="rounded-lg border p-3 max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{summary}</pre>
            </div>
          )}
          {summary && (
            <Button className="w-full" onClick={() => { onInsert(summary); setOpen(false); toast.success("ì°¸ê³  ìë£ì ì¶ê°ëììµëë¤"); }}>
              ì°¸ê³  ìë£ì ì½ì
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// âââ Main Editor Page ââââââââââââââââââââââââââââââââââââââ
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

  // âââ Keywords ââââââââââââââââââââââââââââââââââââââââââââ
  function addKeyword(value?: string) {
    const raw = value || keywordInput;
    const keywords = raw.split(",").map((k) => k.trim()).filter(Boolean);
    for (const kw of keywords) {
      if (mainKeywords.length >= 5) {
        toast.error("í¤ìëë ìµë 5ê°ê¹ì§ ìë ¥í  ì ììµëë¤");
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

  // âââ Subject Suggestions ââââââââââââââââââââââââââââââââââ
  async function suggestSubjects() {
    if (mainKeywords.length === 0) {
      toast.error("í¤ìëë¥¼ ë¨¼ì  ìë ¥í´ì£¼ì¸ì");
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
      toast.error("ì£¼ì  ì¶ì²ì ì¤í¨íìµëë¤");
    } finally {
      setSuggestingSubjects(false);
    }
  }

  // âââ File Upload ââââââââââââââââââââââââââââââââââââââââââ
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("íì¼ í¬ê¸°ë 10MB ì´íë§ ê°ë¥í©ëë¤");
      return;
    }
    if (!file.name.match(/\.(txt|pdf|docx)$/i)) {
      toast.error("txt, pdf, docx íì¼ë§ ì§ìí©ëë¤");
      return;
    }
    if (file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceText(ev.target?.result as string);
        toast.success("íì¼ ë´ì©ì´ ì°¸ê³  íì¤í¸ë¡ ìë ¥ëììµëë¤");
      };
      reader.readAsText(file);
    } else {
      toast.info("PDF/DOCX íì¼ì íì¤í¸ ì¶ì¶ í ë¶ì¬ë£ì´ ì£¼ì¸ì");
    }
    e.target.value = "";
  }

  // âââ SSE Generation ââââââââââââââââââââââââââââââââââââââ
  const handleGenerate = useCallback(async () => {
    if (mainKeywords.length === 0) {
      toast.error("í¤ìëë¥¼ ìµì 1ê° ì´ì ìë ¥í´ì£¼ì¸ì");
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
        throw new Error(data.error || "ìì±ì ì¤í¨íìµëë¤");
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
        toast.warning(`${compViolations.length}ê±´ì ì»´íë¼ì´ì¸ì¤ ìë°ì´ ë°ê²¬ëììµëë¤`);
      } else {
        toast.success("ë¸ë¡ê·¸ ìì±ì´ ìë£ëììµëë¤!");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.info("ìì±ì´ ì¤ë¨ëììµëë¤");
      } else {
        toast.error(err instanceof Error ? err.message : "ìì±ì ì¤í¨íìµëë¤");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [hospitalName, doctorName, personaFeatures, mainKeywords, subject, referenceText, thesisText, contentStyle, targetLength, useWebSearch, title]);

  function handleStop() {
    abortRef.current?.abort();
  }

  // âââ Save âââââââââââââââââââââââââââââââââââââââââââââââââ
  async function handleSave(status: "draft" | "published") {
    if (!title.trim() || !generatedContent.trim()) {
      toast.error("ì ëª©ê³¼ ë´ì©ì ìë ¥í´ì£¼ì¸ì");
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
      toast.success(status === "published" ? "ë°íëììµëë¤!" : "ììì ì¥ ëììµëë¤");
      router.push("/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ì ì¥ì ì¤í¨íìµëë¤");
    } finally {
      setSaving(false);
    }
  }

  function copyContent() {
    navigator.clipboard.writeText(generatedContent);
    toast.success("ë³µì¬ëììµëë¤");
  }

  function downloadTxt() {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || mainKeywords[0] || "blog") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("TXT íì¼ì´ ë¤ì´ë¡ëëììµëë¤");
  }

  function downloadMd() {
    const mdContent = "# " + (title || mainKeywords[0] || "ë¸ë¡ê·¸") + "\n\n" + generatedContent;
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || mainKeywords[0] || "blog") + ".md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("MD íì¼ì´ ë¤ì´ë¡ëëììµëë¤");
  }

  const wordCount = generatedContent.length;

  // âââ Form Content (shared between desktop & mobile) âââââââ
  const formContent = (
    <form onSubmit={(e) => { e.preventDefault(); generating ? handleStop() : handleGenerate(); }} className="space-y-6">
      {/* Card 1: ê¸°ë³¸ ì ë³´ */}
      <Card>
        <CardHeader>
          <CardTitle>ê¸°ë³¸ ì ë³´</CardTitle>
          <CardDescription>ë³ìê³¼ ìì¬ ì ë³´ë¥¼ ìë ¥íì¸ì</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalName">ë³ìëª <span className="text-red-500">*</span></Label>
            <Input id="hospitalName" placeholder="ì: ì°ì¸í¼ë¶ê³¼ìì" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctorName">ìì¬ëª <span className="text-muted-foreground text-xs">(ì íì¬í­)</span></Label>
            <Input id="doctorName" placeholder="ì: ê¹ì°ì¸ (ìë ¥ ì ê¸ì í¬í¨ë©ëë¤)" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona">í¹ì§ (íë¥´ìë) <span className="text-muted-foreground text-xs">(ì íì¬í­)</span></Label>
            <Textarea
              id="persona"
              placeholder="ì: 15ë ê²½ë ¥ ìë£ì§, ë ì´ì  ë° ë¦¬íí ìì  ê²½í íë¶, í¸ìíê³  ì¹ê·¼í ìë´ ì¤íì¼"
              value={personaFeatures}
              onChange={(e) => setPersonaFeatures(e.target.value.slice(0, 500))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">ë³ì/ìë£ì§ì í¹ì§, ìì  ê²½í, ê²½ë ¥, ì í¸íë ë§í¬ ë± ({personaFeatures.length}/500)</p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: í¤ìë ì¤ì  */}
      <Card>
        <CardHeader>
          <CardTitle>í¤ìë ì¤ì </CardTitle>
          <CardDescription>ë¸ë¡ê·¸ì ì£¼ì í¤ìëì ì ì²´ ì£¼ì ë¥¼ ìë ¥íì¸ì</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">ì£¼ì í¤ìë <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="ì£¼ì í¤ìë ìë ¥ (ì: ì¸ìë¼, HIFU)"
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
            <p className="text-xs text-muted-foreground">{mainKeywords.length}/5 íê·¸ â¢ Enter ëë ì¼í(,)ë¡ ì¶ê°</p>
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
              <Label htmlFor="subject">ì ì²´ ì£¼ì  <span className="text-muted-foreground text-xs">(ì íì¬í­)</span></Label>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={suggestSubjects} disabled={suggestingSubjects}>
                {suggestingSubjects ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                AI ì£¼ì  ì¶ì²
              </Button>
            </div>
            <Input id="subject" placeholder="ì: ë¦¬íí ìì ì ì¢ë¥ì ì í ê¸°ì¤ (ì ì²´ì ì¸ ê¸ì ë°©í¥ì±)" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <p className="text-xs text-muted-foreground">ê¸ ì ì²´ë¥¼ ê´íµíë ì£¼ì ë ë¼ì§ë¥¼ ìë ¥íë©´ ë ì¼ê´ë ë´ì©ì´ ìì±ë©ëë¤</p>
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

      {/* Card 3: ì°¸ê³  íì¤í¸ */}
      <Card>
        <CardHeader>
          <CardTitle>ì°¸ê³  íì¤í¸</CardTitle>
          <CardDescription>ë¸ë¡ê·¸ ìì±ì ìí ì°¸ê³  ìë£ë¥¼ ìë ¥íì¸ì</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> ì¹ ê²ìì¼ë¡ ìµì  ì ë³´ ì¶ê°
              </Label>
              <p className="text-xs text-muted-foreground">ë©ì¸ í¤ìëë¥¼ ê¸°ë°ì¼ë¡ ìµì  ìí ì ë³´ë¥¼ ìë ê²ìí©ëë¤.</p>
            </div>
            <Switch checked={useWebSearch} onCheckedChange={setUseWebSearch} />
          </div>
          <YouTubeSummaryDialog onInsert={(text) => setReferenceText((prev) => prev + (prev ? "\n\n---\n\n" : "") + text)} />
          <div className="space-y-2">
            <Label htmlFor="referenceText">ì°¸ê³  íì¤í¸</Label>
            <div className="relative border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary"); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary"); const file = e.dataTransfer.files[0]; if (file) { const input = fileInputRef.current; if (input) { const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true })); } } }}
            >
              <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">íì¼ì ëëê·¸íê±°ë í´ë¦­íì¬ ìë¡ë</p>
              <p className="text-xs text-muted-foreground mt-1">.docx, .pdf, .txt íì¼ ì§ì (ìµë 10MB)</p>
            </div>
            <Textarea id="referenceText" placeholder="ë¸ë¡ê·¸ ìì±ì ìí ì°¸ê³  íì¤í¸ë¥¼ ìë ¥íê±°ë íì¼ì ìë¡ëíì¸ì..." value={referenceText} onChange={(e) => setReferenceText(e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: íì  ìë£ */}
      <Card>
        <CardHeader>
          <CardTitle>íì  ìë£</CardTitle>
          <CardDescription>ë¼ë¬¸ì´ë íì  ìë£ë¥¼ ìë ¥íì¸ì</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thesisText">ë¼ë¬¸ íì¤í¸ <span className="text-muted-foreground text-xs">(ì íì¬í­)</span></Label>
            <Textarea id="thesisText" placeholder="ìí ë¼ë¬¸ì´ë íì  ìë£ë¥¼ ìë ¥íì¸ì..." value={thesisText} onChange={(e) => setThesisText(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground">ìí ë¼ë¬¸ì´ë íì  ìë£ë¥¼ ìë ¥íë©´ ë ì ë¬¸ì ì¸ ë´ì©ì´ ìì±ë©ëë¤</p>
          </div>
          <Dialog open={pubmedOpen} onOpenChange={setPubmedOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 w-full rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 text-sm font-medium">
                <BookOpen className="h-4 w-4" /> ë¼ë¬¸ ê²ì
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> PubMed ë¼ë¬¸ ê²ì
                </DialogTitle>
              </DialogHeader>
              <PubMedPanel keywords={mainKeywords} onSelectPaper={(text) => { setThesisText((prev) => prev + (prev ? "\n\n" : "") + text); toast.success("ë¼ë¬¸ì´ íì  ìë£ì ì¶ê°ëììµëë¤"); }} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Card 5: ì¤íì¼ ì¤ì  */}
      <Card>
        <CardHeader>
          <CardTitle>ì¤íì¼ ì¤ì </CardTitle>
          <CardDescription>ì½íì¸  ì¤íì¼ê³¼ ê¸ììë¥¼ ì¤ì íì¸ì</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>ì½íì¸  ì¤íì¼</Label>
            <RadioGroup value={contentStyle} onValueChange={setContentStyle} className="space-y-2">
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "standard" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="standard" id="style-standard" />
                <div>
                  <p className="text-sm font-medium">íì¤ (Standard)</p>
                  <p className="text-xs text-muted-foreground">- ì ë¬¸ì ì´ê³  ëªíí ì¤ëª</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "friendly" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="friendly" id="style-friendly" />
                <div>
                  <p className="text-sm font-medium">ì¹ê·¼í¨ (Friendly)</p>
                  <p className="text-xs text-muted-foreground">- ë°ë»íê³  ì¹ê·¼í í¤</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${contentStyle === "casual" ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                <RadioGroupItem value="casual" id="style-casual" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">ìºì£¼ì¼ (Casual)</p>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">ì¶ì²</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">- ëííë¯ ë¶ëë½ê² ì´ì´ì§ë ë¬¸ì¥ ì¤íì¼</p>
                </div>
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>ëª©í ê¸ìì</Label>
              <span className="text-sm font-semibold text-primary">{targetLength.toLocaleString()}ì</span>
            </div>
            <input type="range" min={500} max={3000} step={100} value={targetLength} onChange={(e) => setTargetLength(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex items-center justify-between">
              <Input type="number" value={targetLength} onChange={(e) => setTargetLength(Math.min(3000, Math.max(500, Number(e.target.value))))} className="w-24 h-8 text-sm" />
            </div>
            <p className="text-xs text-muted-foreground">ê¶ì¥: 1500ì (Â±10% ë²ì ë´ìì ìì±ë©ëë¤)</p>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button type="submit" className="w-full" variant={generating ? "destructive" : "default"} size="lg">
        {generating ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> ìì± ì¤ë¨</>) : (<><Wand2 className="h-4 w-4 mr-2" /> ë¸ë¡ê·¸ ìì±</>)}
      </Button>
    </form>
  );

  // âââ Result Content âââââââââââââââââââââââââââââââââââââââ
  const resultContent = (
    <div className="min-h-[600px] flex flex-col">
      {!generatedContent && !generating && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-20">
          <Wand2 className="h-16 w-16 mb-6 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">ë¸ë¡ê·¸ë¥¼ ìì±í´ë³´ì¸ì</h3>
          <p className="text-sm max-w-sm">ì¢ì¸¡ í¼ì ìì±íê³  &apos;ë¸ë¡ê·¸ ìì±&apos; ë²í¼ì í´ë¦­íë©´ AIê° ì ë¬¸ì ì¸ ë¸ë¡ê·¸ ê¸ì ìì±í´ëë¦½ëë¤.</p>
        </div>
      )}
      {generating && !generatedContent && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">ë¸ë¡ê·¸ë¥¼ ìì±íê³  ììµëë¤...</p>
        </div>
      )}
      {(generatedContent || generating) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Input placeholder="ë¸ë¡ê·¸ ì ëª©" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 flex-1" />
            {wordCount > 0 && <Badge variant="outline" className="text-xs">{wordCount.toLocaleString()}ì</Badge>}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {generatedContent}
            {generating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
          </div>
          {generatedContent && !generating && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={copyContent}><Copy className="h-4 w-4 mr-1" /> ë³µì¬</Button>
              <Button variant="outline" size="sm" onClick={downloadTxt}><FileText className="h-4 w-4 mr-1" /> TXT</Button>
              <Button variant="outline" size="sm" onClick={downloadMd}><FileText className="h-4 w-4 mr-1" /> MD</Button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving}><Save className="h-4 w-4 mr-1" /> ììì ì¥</Button>
                <Button size="sm" onClick={() => handleSave("published")} disabled={saving}><Send className="h-4 w-4 mr-1" /> ë°í</Button>
              </div>
            </div>
          )}
          {violations.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {violations.length}ê±´ì ì»´íë¼ì´ì¸ì¤ ìë° ì¬í­ì´ ë°ê²¬ëììµëë¤. ìì ì ê¶ì¥í©ëë¤.
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
          <PenLine className="h-6 w-6" /> AI ë¸ë¡ê·¸ ìì±
        </h2>
        <p className="text-muted-foreground mt-1">ìë£ë²ì ì¤ìíë ì ë¬¸ ë¸ë¡ê·¸ ì½íì¸ ë¥¼ AIë¡ ìë ìì±í©ëë¤.</p>
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
            <TabsTrigger value="input">ìë ¥</TabsTrigger>
            <TabsTrigger value="result">ê²°ê³¼</TabsTrigger>
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
