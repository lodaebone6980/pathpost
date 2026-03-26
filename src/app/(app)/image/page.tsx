"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedPage } from "@/components/animations";
import { ImageIcon, Download, Loader2, Upload, Sparkles, Camera } from "lucide-react";
import type { GeneratedImage } from "@/types/image";

const STYLE_OPTIONS = [
  { id: "k-beauty", label: "K-beauty Studio", icon: "✨", desc: "프로페셔널 K-beauty 에디토리얼 스타일" },
  { id: "sns-snapshot", label: "SNS Snapshot", icon: "📷", desc: "캐주얼 SNS 라이프스타일 스타일" },
];

const RATIO_OPTIONS = [
  { value: "4:5", label: "4:5 — 인스타그램 피드 (기본)" },
  { value: "1:1", label: "1:1 — 정사각형" },
  { value: "3:4", label: "3:4 — 세로 포트레이트" },
  { value: "2:3", label: "2:3 — 세로 포트레이트 (길게)" },
  { value: "9:16", label: "9:16 — 스토리/릴스" },
  { value: "16:9", label: "16:9 — 와이드" },
  { value: "3:2", label: "3:2 — 가로 포트레이트" },
  { value: "4:3", label: "4:3 — 가로 표준" },
];

const TEXT_EXAMPLES = [
  "니트를 입고 길거리에 염색을 한 20대 여성, ...",
  "카페에서 커피를 마시는 30대 여성, 자연광",
  "흰색 블라우스를 입은 여성, 미니멀한 스튜디오...",
  "베이지색 코트를 입은 여성, 가을 분위기",
];

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("k-beauty");
  const [ratio, setRatio] = useState("4:5");
  const [inputTab, setInputTab] = useState<"text" | "image">("text");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyUsed, setDailyUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch("/api/image");
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
          const today = new Date().toDateString();
          const todayCount = (data.images || []).filter((img: GeneratedImage) =>
            new Date(img.created_at).toDateString() === today
          ).length;
          setDailyUsed(todayCount);
        }
      } finally { setLoading(false); }
    }
    loadImages();
  }, []);

  function handleReferenceFile(file: File) {
    if (!["image/jpeg","image/png","image/webp","image/heic"].includes(file.type)) {
      toast.error("JPEG, PNG, WebP, HEIC 파일만 지원합니다"); return;
    }
    if (file.size > 7*1024*1024) { toast.error("파일 크기는 7MB 이하여야 합니다"); return; }
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error("이미지 설명을 입력해주세요"); return; }
    if (dailyUsed >= 15) { toast.error("일일 이미지 생성 한도(15회)에 도달했습니다"); return; }
    setGenerating(true);
    try {
      let res: Response;
      if (inputTab === "image" && referenceFile) {
        const formData = new FormData();
        formData.append("prompt", prompt); formData.append("style", style); formData.append("ratio", ratio);
        formData.append("referenceImage", referenceFile);
        res = await fetch("/api/image/generate", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/image/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, style, ratio }),
        });
      }
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      const data = await res.json();
      setImages(prev => [data.image, ...prev]);
      setDailyUsed(prev => prev + 1);
      toast.success("이미지가 생성되었습니다!");
      setPrompt(""); setReferenceFile(null as File | null); setReferencePreview(null as string | null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이미지 생성에 실패했습니다");
    } finally { setGenerating(false); }
  }

  function handleDownload(url: string) {
    const a = document.createElement("a");
    a.href = url; a.download = `pathpost-image-${Date.now()}.webp`; a.target = "_blank"; a.click();
    toast.success("다운로드를 시작합니다");
  }

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">이미지 생성</h2>
            <p className="text-muted-foreground mt-1">레퍼런스 이미지 또는 텍스트를 입력하여 AI 이미지를 생성합니다.</p>
          </div>
          <Badge variant="outline" className="text-sm">오늘 {dailyUsed}/15장 사용</Badge>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">스타일 선택</p>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((s) => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors ${
                      style === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}>
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">입력 방식</p>
              <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as "text" | "image")}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="text">텍스트 입력</TabsTrigger>
                  <TabsTrigger value="image">이미지 업로드</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="mt-4 space-y-3">
                  <Textarea placeholder="원하는 이미지를 자연스럽게 설명해주세요..." value={prompt}
                    onChange={(e) => setPrompt(e.target.value)} className="min-h-[100px] resize-none" />
                  <div className="flex flex-wrap gap-2">
                    {TEXT_EXAMPLES.map((ex) => (
                      <button key={ex} onClick={() => setPrompt(ex)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">{ex}</button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="image" className="mt-4 space-y-3">
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    {referencePreview ? (
                      <img src={referencePreview} alt="reference" className="w-full object-contain max-h-48 rounded-md" />
                    ) : (
                      <><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">클릭하거나 파일을 드래그하여 업로드</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">JPEG, PNG, WebP, HEIC (최대 7MB)</p></>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                      className="hidden" onChange={(e) => e.target.files?.[0] && handleReferenceFile(e.target.files[0])} />
                  </div>
                  <Textarea placeholder="레퍼런스 이미지를 기반으로 원하는 추가 설명을 입력하세요..." value={prompt}
                    onChange={(e) => setPrompt(e.target.value)} className="min-h-[80px] resize-none" />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">비율</p>
              <Select value={ratio} onValueChange={(v: string) => setRatio(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RATIO_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate}
              disabled={generating || !prompt.trim() || dailyUsed >= 15}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />생성 중...</>
                : <><Sparkles className="h-4 w-4 mr-2" />이미지 생성</>}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4" /> 생성된 이미지
          </h3>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">이미지 업로드 혹은 텍스트를 입력한 후 생성하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(img => (
                <div key={img.id} className="group relative rounded-lg overflow-hidden border bg-muted aspect-square">
                  <Image src={img.public_url} alt={img.prompt} fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2 w-full">
                      <p className="text-white text-xs flex-1 line-clamp-2">{img.prompt}</p>
                      <Button size="sm" variant="secondary" className="shrink-0" onClick={() => handleDownload(img.public_url)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
