import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { voiceKeyMatches } from "./voice-key";

const cache = new Map<string, string>();

async function signedIn(): Promise<boolean> {
  const auth = getRequest()?.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || !url || !key) return false;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getClaims(token);
  return !error && !!data?.claims?.sub;
}

/** Turns one presenter line into WAV audio (base64). Allowed for signed-in users or the private stream voice key. */
export const speakLine = createServerFn({ method: "POST" })
  .inputValidator((d: { text: string; voiceKey?: string | null }) => {
    const text = String(d?.text ?? "").trim().slice(0, 400);
    if (!text) throw new Error("Empty line");
    return { text, voiceKey: typeof d?.voiceKey === "string" ? d.voiceKey.slice(0, 200) : null };
  })
  .handler(async ({ data }): Promise<{ audio: string | null; error: string | null }> => {
    const ok = voiceKeyMatches(data.voiceKey, process.env["STREAM_VOICE_KEY"]) || (await signedIn().catch(() => false));
    if (!ok) return { audio: null, error: "Not authorised" };
    const hit = cache.get(data.text);
    if (hit) return { audio: hit, error: null };
    const key = process.env["LOVABLE_API_KEY"];
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
