import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { generateImage } from "@/lib/ai/gemini";
import { isValidImageModel, DEFAULT_IMAGE_MODEL } from "@/lib/ai/models";
import { uploadImage } from "@/lib/storage/supabase-storage";
import { createServerClient } from "@/lib/supabase/server";
import type { ImageModel } from "@/types/image";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { prompt, model: requestedModel } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "프롬프트를 입력해주세요" }, { status: 400 });
    }

    const model: ImageModel = requestedModel && isValidImageModel(requestedModel)
      ? requestedModel
      : DEFAULT_IMAGE_MODEL;

    // Check daily limit
    const supabase = createServerClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.sub)
      .gte("created_at", today.toISOString());

    if ((count || 0) >= 20) {
      return NextResponse.json({ error: "일일 이미지 생성 한도(20회)에 도달했습니다" }, { status: 429 });
    }

    // Generate image
    const { base64, mimeType } = await generateImage(prompt, model);
    const imageBuffer = Buffer.from(base64, "base64");

    // Convert to WebP
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 85 })
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .toBuffer();

    // Upload to Supabase Storage
    const filename = `${randomUUID()}.webp`;
    const { path, publicUrl } = await uploadImage(webpBuffer, session.sub, filename);

    // Save metadata
    const { data: savedImage, error } = await supabase
      .from("generated_images")
      .insert({
        user_id: session.sub,
        prompt,
        model,
        storage_path: path,
        public_url: publicUrl,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "이미지 메타데이터 저장 실패" }, { status: 500 });
    }

    return NextResponse.json({
      image: savedImage,
      imageUrl: publicUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "이미지 생성에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
