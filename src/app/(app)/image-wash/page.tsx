"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/animations";
import { Upload, Download, CheckCircle, XCircle, Info, Loader2, Image as ImageIcon, Eraser } from "lucide-react";

interface WashResult {
  success: boolean; originalName: string; washedName?: string;
  base64?: string; mimeType?: string; size?: number; error?: string;
}
interface MonthlyUsage { used: number; limit: number; }

export default function ImageWashPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<WashResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [hashDispersion, setHashDispersion] = useState(true);
  const [keepExtension, setKeepExtension] = useState(true);
  const [usage, setUsage] = useState<MonthlyUsage>({ used: 0, limit: 50 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUsage() {
      try { const res = await fetch("/api/image/wash"); if (res.ok) setUsage(await res.json()); }
      catch { /* silent */ }
    }
    loadUsage();
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 5*1024*1024);
    if (valid.length !== newFiles.length) toast.error("JPG, PNG, WebP (최대 5MB) 파일만 지원합니다");
    const combined = [...files, ...valid].slice(0, 10);
    setFiles(combined); setResults([]);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
  }, [files]);

  function handleRemove(idx: number) {
    setFiles(prev => prev.filter((_,i)=>i!==idx));
    setPreviews(prev => prev.filter((_,i)=>i!==idx));
    setResults([]);
  }

  async function handleProcess() {
    if (files.length === 0) { toast.error("이미지를 먼저 업로드해주세요"); return; }
    setProcessing(true); setResults([]);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("images", f));
      formData.append("hashDispersion", String(hashDispersion));
      formData.append("keepExtension", String(keepExtension));
      const res = await fetch("/api/image/wash", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "워싱 처리에 실패했습니다");
      setResults(data.results); setUsage(data.monthlyUsage);
      toast.success(`${data.processed}장 처리 완료!`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "처리에 실패했습니다"); }
    finally { setProcessing(false); }
  }

  function handleDownload(result: WashResult) {
    if (!result.base64 || !result.mimeType || !result.washedName) return;
    const byteString = atob(result.base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = result.washedName; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadAll() {
    results.filter(r=>r.success).forEach(r=>handleDownload(r));
    toast.success("모든 파일 다운로드 시작!");
  }

  const usagePercent = Math.round((usage.used/usage.limit)*100);

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Eraser className="h-6 w-6 text-primary" /> 이미지 워싱
            </h2>
            <p className="text-muted-foreground mt-1">이미지 메타데이터 제거, 파일명 무작위화, 해시 분산으로 프라이버시를 보호하세요.</p>
          </div>
          <Badge variant="outline">사용량: {usage.used}/{usage.limit}장</Badge>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">이미지에서 EXIF 메타데이터(GPS, 카메라 정보, 촬영 시간 등)를 완전히 제거하고, 파일명을 무작위화하여 프라이버시를 보호합니다. 해시 분산 모드를 사용하면 플랫폼의 중복 이미지 감지도 회피할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> 이미지 업로드</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(Array.from(e.dataTransfer.files));}}
                onClick={()=>fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">클릭하거나 파일을 드래그하여 업로드</p>
                <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP (최대 5MB)</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                  onChange={e=>handleFiles(Array.from(e.target.files||[]))} />
              </div>
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file,i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(file.size/1024).toFixed(0)}KB</span>
                      <button onClick={e=>{e.stopPropagation();handleRemove(i);}} className="text-muted-foreground hover:text-destructive shrink-0"><XCircle className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">최대 10장, 파일당 5MB까지 업로드 가능 (JPG, PNG, WebP)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">처리 옵션</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">해시 분산 모드</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">미세한 재샘플링으로 시각적 동일성을 유지하면서 perceptual hash를 변경합니다.</p>
                </div>
                <Switch checked={hashDispersion} onCheckedChange={setHashDispersion} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">원본 확장자 유지</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">원본 이미지의 확장자(JPG, PNG, WebP)를 그대로 유지합니다.</p>
                </div>
                <Switch checked={keepExtension} onCheckedChange={setKeepExtension} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>월 사용량</span><span>{usage.used} / {usage.limit}장</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{width:`${Math.min(usagePercent,100)}%`}} />
                </div>
              </div>
              <Button className="w-full" onClick={handleProcess} disabled={processing||files.length===0}>
                {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />처리 중...</>
                  : <><Eraser className="h-4 w-4 mr-2" />워싱 시작 ({files.length}장)</>}
              </Button>
              <p className="text-xs text-muted-foreground/70 text-center">주의: 이 도구는 합법적인 개인정보 보호 목적으로만 사용하세요.</p>
            </CardContent>
          </Card>
        </div>

        {results.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  처리 결과 ({results.filter(r=>r.success).length}/{results.length}장 성공)
                </CardTitle>
                {results.some(r=>r.success) && (
                  <Button size="sm" variant="outline" onClick={handleDownloadAll}><Download className="h-4 w-4 mr-1" /> 전체 다운로드</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result,i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-md text-sm ${result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                    {result.success ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{result.originalName}</p>
                      {result.success ? <p className="text-xs text-muted-foreground">→ {result.washedName} ({result.size?(result.size/1024).toFixed(0)+"KB":""})</p>
                        : <p className="text-xs text-red-500">{result.error}</p>}
                    </div>
                    {result.success && <Button size="sm" variant="ghost" onClick={()=>handleDownload(result)}><Download className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AnimatedPage>
  );
}
