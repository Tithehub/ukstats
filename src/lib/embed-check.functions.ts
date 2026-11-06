import { createServerFn } from "@tanstack/react-start";

let cached: { id: string; ok: boolean; at: number } | null = null;

/** True when YouTube allows the video to play on other websites (oEmbed 200); 401/403 = embedding off. */
export const checkEmbeddable = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => {
    if (!/^[\w-]{11}$/.test(d?.id ?? "")) throw new Error("Bad video id");
    return d;
  })
  .handler(async ({ data }) => {
    if (cached && cached.id === data.id && Date.now() - cached.at < 300_000) return { ok: cached.ok };
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${data.id}`)}&format=json`);
      await r.body?.cancel();
      const ok = r.status !== 401 && r.status !== 403;
      cached = { id: data.id, ok, at: Date.now() };
      return { ok };
    } catch {
      return { ok: true };
    }
  });
