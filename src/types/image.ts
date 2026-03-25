export type ImageModel =
  | "gemini-3.1-flash-image-preview"   // 나노바나나2
  | "gemini-2.0-flash-exp"             // Gemini 2.0 Flash
  | "gemini-2.5-pro-preview";          // Gemini 2.5 Pro

export interface ImageModelInfo {
  id: ImageModel;
  name: string;
  description: string;
  pricePerImage: string;
}

export const IMAGE_MODELS: ImageModelInfo[] = [
  {
    id: "gemini-3.1-flash-image-preview",
    name: "나노바나나2",
    description: "Pro급 품질 + Flash 속도, 한국어 텍스트 렌더링, 4K 지원",
    pricePerImage: "~$0.067",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    description: "Imagen 3 기반, 빠르고 저렴한 이미지 생성",
    pricePerImage: "~$0.04",
  },
  {
    id: "gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    description: "최고 품질, 복잡한 장면 구성에 적합",
    pricePerImage: "~$0.10+",
  },
];

export interface GenerateImageRequest {
  prompt: string;
  model?: ImageModel;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  blog_id: string | null;
  prompt: string;
  model: ImageModel;
  storage_path: string;
  public_url: string;
  created_at: string;
}
