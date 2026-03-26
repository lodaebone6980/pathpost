import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@/lib/supabase/server";

const MONTHLY_LIMIT = 50;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data"))
      return NextResponse.json({ error: "multipart/form-data 형식으로 전송해주세요" }, { status: 400 });

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const useHashDispersion = formData.get("hashDispersion") !== "false";
    const keepExtension = formData.get("keepExtension") !== "false";

    if (!files || files.length === 0) return NextResponse.json({ error: "이미지를 업로드해주세요" }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "최대 10장까지 처리 가능합니다" }, { status: 400 });

    const supabase = createServerClient();
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const { count: monthlyCount } = await supabase.from("washed_images")
      .select("*", { count: "exact", head: true }).eq("user_id", session.sub)
      .gte("created_at", startOfMonth.toISOString());

    const used = monthlyCount || 0;
    if (used + files.length > MONTHLY_LIMIT)
      return NextResponse.json({ error: `월 사용량 초과입니다. 현재 ${used}/${MONTHLY_LIMIT}장 사용됨` }, { status: 429 });

    const results = await Promise.all(files.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);
        const originalMime = file.type || "image/jpeg";
        const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        const ext = extMap[originalMime] || "jpg";

        let sharpInstance = sharp(inputBuffer).withMetadata({ exif: {} });

        if (useHashDispersion) {
          const meta = await sharp(inputBuffer).metadata();
          const w = meta.width || 1000; const h = meta.height || 1000;
          sharpInstance = sharpInstance
            .extract({ left: 1, top: 1, width: Math.max(1, w-2), height: Math.max(1, h-2) })
            .resize(w, h, { fit: "fill" });
        }

        let outputBuffer: Buffer; let outputMime: string;
        if (keepExtension) {
          if (originalMime === "image/png") { outputBuffer = await sharpInstance.png({ compressionLevel: 6 }).toBuffer(); outputMime = "image/png"; }
          else if (originalMime === "image/webp") { outputBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer(); outputMime = "image/webp"; }
          else { outputBuffer = await sharpInstance.jpeg({ quality: 90 }).toBuffer(); outputMime = "image/jpeg"; }
        } else { outputBuffer = await sharpInstance.jpeg({ quality: 90 }).toBuffer(); outputMime = "image/jpeg"; }

        const randomName = `${randomUUID()}.${keepExtension ? ext : "jpg"}`;
        const base64 = outputBuffer.toString("base64");

        await supabase.from("washed_images").insert({
          user_id: session.sub, original_filename: file.name, washed_filename: randomName,
        }).throwOnError();

        return { success: true, originalName: file.name, washedName: randomName, base64, mimeType: outputMime, size: outputBuffer.length };
      } catch (err) {
        return { success: false, originalName: file.name, error: err instanceof Error ? err.message : "처리 실패" };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    return NextResponse.json({
      results, processed: successCount, total: files.length,
      monthlyUsage: { used: used + successCount, limit: MONTHLY_LIMIT },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "이미지 워싱에 실패했습니다" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });

  const supabase = createServerClient();
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const { count } = await supabase.from("washed_images")
    .select("*", { count: "exact", head: true }).eq("user_id", session.sub)
    .gte("created_at", startOfMonth.toISOString());

  return NextResponse.json({ used: count || 0, limit: MONTHLY_LIMIT });
}
