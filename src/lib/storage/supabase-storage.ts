import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "blog-images";

export async function uploadImage(
  buffer: Buffer,
  userId: string,
  filename: string,
  contentType = "image/webp"
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createAdminClient();
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}
