import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { generateImage } from "@/lib/ai/gemini";
import { isValidImageModel, DEFAULT_IMAGE_MODEL } from "@/lib/ai/models";
import { uploadImage } from "@/lib/storage/supabase-storage";
import { createServerClient } from "@/lib/supabase/server";
import type { ImageModel } from "@/types/image";

const STYLE_PROMPTS: Record<string, string> = {
  "k-beauty": "Professional K-beauty editorial photography style. Clean, high-end aesthetic with soft lighting. Korean medical/beauty clinic atmosphere. Elegant and polished look suitable for premium Korean skincare or medical spa blog.",
  "sns-snapshot": "Casual lifestyle SNS snapshot style. Natural, candid feeling. Warm and approachable. Suitable for social media posts about beauty treatments or wellness.",
};

const RATIO_MAP: Record<string, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "3:4": { width: 1080, height: 1440 },
  "2:3": { width: 1080, height: 1620 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "3:2": { width: 1620, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });

  try {
    const contentType = request.headers.get("content-type") || "";
    let prompt = "", style = "k-beauty", ratio = "4:5";
    let model: ImageModel = DEFAULT_IMAGE_MODEL;
    let referenceImageBase64: string | null = null;
    let referenceImageMime = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      prompt = formData.get("prompt") as string || "";
      model = (formData.get("model") as ImageModel) || DEFAULT_IMAGE_MODEL;
      style = (formData.get("style") as string) || "k-beauty";
      ratio = (formData.get("ratio") as string) || "4:5";
      const file = formData.get("referenceImage") as File | null;
      if (file) {
        const ab = await file.arrayBuffer();
        referenceImageBase64 = Buffer.from(ab).toString("base64");
        referenceImageMime = file.type || "image/jpeg";
      }
    } else {
      const body = await request.json();
      prompt = body.prompt;
      model = body.model && isValidImageModel(body.model) ? body.model : DEFAULT_IMAGE_MODEL;
      style = body.style || "k-beauty";
      ratio = body.ratio || "4:5";
    }

    if (!prompt) return NextResponse.json({ error: "프롬프트를 입력해주세요" }, { status: 400 });
    if (!isValidImageModel(model)) model = DEFAULT_IMAGE_MODEL;

    const supabase = createServerClient();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { count } = await supabase.from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.sub).gte("created_at", today.toISOString());
    if ((count || 0) >= 15)
      return NextResponse.json({ error: "일일 이미지 생성 한도(15회)에 도달했습니다" }, { status: 429 });

    const stylePrefix = STYLE_PROMPTS[style] || STYLE_PROMPTS["k-beauty"];
    const fullPrompt = referenceImageBase64
      ? `${stylePrefix}. Based on the reference image style: ${prompt}`
      : `${stylePrefix}. ${prompt}`;

    const refImg = referenceImageBase64 ? { base64: referenceImageBase64, mimeType: referenceImageMime } : undefined;
    const { base64 } = await generateImage(fullPrompt, model, refImg);
    const imageBuffer = Buffer.from(base64, "base64");

    const targetSize = RATIO_MAP[ratio] || RATIO_MAP["4:5"];
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 85 })
      .resize(targetSize.width, targetSize.height, { fit: "cover", position: "center" })
      .toBuffer();

    const filename = `${randomUUID()}.webp`;
    const { path, publicUrl } = await uploadImage(webpBuffer, session.sub, filename);
    const { data: savedImage, error } = await supabase.from("generated_images")
      .insert({ user_id: session.sub, prompt, model, storage_path: path, public_url: publicUrl })
      .select().single();
    if (error) return NextResponse.json({ error: "이미지 메타데이터 저장 실패" }, { status: 500 });
    return NextResponse.json({ image: savedImage, imageUrl: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "이미지 생성에 실패했습니다" }, { status: 500 });
  }
}
