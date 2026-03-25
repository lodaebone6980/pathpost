"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Download, Copy } from "lucide-react";
import { IMAGE_MODELS, type ImageModel, type GeneratedImage } from "@/types/image";

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ImageModel>("gemini-3.1-flash-image-preview");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch("/api/image");
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
        }
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      setImages((prev) => [data.image, ...prev]);
      toast.success("이미지가 생성되었습니다!");
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이미지 생성에 실패했습니다");
    } finally {
      setGenerating(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL이 복사되었습니다");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI 이미지 생성</h2>
        <p className="text-muted-foreground mt-1">Gemini API로 의료 일러스트를 생성합니다</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="생성할 이미지를 설명하세요 (예: 심장 구조 일러스트)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                className="flex-1"
              />
              <Select value={model} onValueChange={(v) => setModel(v as ImageModel)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div>
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{m.pricePerImage}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={generating} className="w-full sm:w-auto">
              {generating ? "생성 중..." : "이미지 생성"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generating && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">이미지를 생성하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">생성된 이미지</h3>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              아직 생성된 이미지가 없습니다
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={img.public_url}
                    alt={img.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyUrl(img.public_url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a href={img.public_url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
