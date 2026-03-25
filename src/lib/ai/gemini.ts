import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_TEXT_MODEL } from "./models";
import type { ImageModel } from "@/types/image";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function generateText(
  prompt: string,
  systemInstruction?: string,
  model: string = DEFAULT_TEXT_MODEL
): Promise<string> {
  const genModel = genAI.getGenerativeModel({
    model,
    ...(systemInstruction && { systemInstruction }),
  });

  const result = await genModel.generateContent(prompt);
  return result.response.text();
}

export async function generateImage(
  prompt: string,
  model: ImageModel = "gemini-3.1-flash-image-preview"
): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Medical illustration style, clean and professional. Healthcare/medical context. No text or watermarks. High quality, suitable for a medical blog post. Subject: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          responseMimeType: "image/png",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts;

  if (!parts) throw new Error("No image generated");

  const imagePart = parts.find(
    (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData) throw new Error("No image data in response");

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}
