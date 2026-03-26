import { DEFAULT_TEXT_MODEL } from "@/lib/ai/models";

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push("step1: start");
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    steps.push("step2: apiKey exists=" + !!apiKey + " len=" + (apiKey ? apiKey.length : 0));
    steps.push("step3: model=" + DEFAULT_TEXT_MODEL);
    const testBody = {
      contents: [{ parts: [{ text: "Say hi" }] }],
      generationConfig: { maxOutputTokens: 10 }
    };
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + DEFAULT_TEXT_MODEL + ":generateContent?key=" + apiKey;
    steps.push("step5: fetching gemini");
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testBody)
    });
    steps.push("step6: status=" + res.status);
    if (!res.ok) {
      const errText = await res.text();
      steps.push("step7: err=" + errText.substring(0, 200));
    } else {
      steps.push("step7: success");
    }
    return new Response(JSON.stringify({ steps }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    steps.push("ERROR: " + String(err));
    return new Response(JSON.stringify({ steps }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
