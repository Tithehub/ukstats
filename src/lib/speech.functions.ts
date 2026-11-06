import { createServerFn } from "@tanstack/react-start";

const cache = new Map<string, string>();

/** Turns one presenter line into WAV audio (base64). Lines are short and cached by exact wording. */
export const speakLine = createServerFn({ method: "POST" })
  .inputValidator((d: { text: string }) => {
    const text = String(d?.text ?? "").trim().slice(0, 400);
    if (!text) throw new Error("Empty line");
    return { text };
  })
  .handler(async ({ data }): Promise<{ audio: string | null; error: string | null }> => {
    const hit = cache.get(data.text);
    if (hit) return { audio: hit, error: null };
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { audio: null, error: "Voice not configured" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-tts-preview",
        contents: [{ role: "user", parts: [{ text: `Read this in a calm, clear British television newsreader voice: ${data.text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
        stream_format: "audio",
      }),
    });
    if (!res.ok) { await res.body?.cancel(); return { audio: null, error: `Voice unavailable (${res.status})` }; }
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    const b64 = btoa(bin);
    if (cache.size > 300) cache.clear();
    cache.set(data.text, b64);
    return { audio: b64, error: null };
  });
