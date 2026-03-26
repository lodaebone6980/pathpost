import type { ImageModel } from "@/types/image";

export const DEFAULT_IMAGE_MODEL: ImageModel = "gemini-3.1-flash-image-preview";
export const DEFAULT_TEXT_MODEL = "gemini-2.5-pro";

export function isValidImageModel(model: string): model is ImageModel {
  return [
    "gemini-3.1-flash-image-preview",
    "gemini-2.0-flash-exp",
    "gemini-2.5-pro",
  ].includes(model);
}
