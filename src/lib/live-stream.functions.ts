import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LIVE_STREAM_ID } from "@/lib/brand";
import { parseStreamId } from "@/lib/live-stream";

const ROW = "live-stream";

export const getLiveStreamId = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data, updated_at").eq("id", ROW).maybeSingle();
    const id = data?.data?.id;
    if (typeof id === "string" && /^[\w-]{11}$/.test(id)) return { id, updatedAt: data.updated_at as string | null };
  } catch { /* fall back */ }
  return { id: LIVE_STREAM_ID, updatedAt: null };
});

export const setLiveStreamId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { link: string }) => ({ link: String(d?.link ?? "").slice(0, 500) }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admins only");
    const id = parseStreamId(data.link);
    if (!id) return { ok: false as const, error: "That doesn't look like a YouTube video or live link." };
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
      await r.body?.cancel();
      if (r.status === 401 || r.status === 403) return { ok: false as const, error: "YouTube says embedding is turned off for this video. Turn it on in YouTube Studio, then try again." };
      if (r.status === 404 || r.status === 400) return { ok: false as const, error: "YouTube can't find that video." };
    } catch { /* network blip: allow */ }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ROW, data: { id, updatedAt: now }, updated_at: now });
    if (error) return { ok: false as const, error: "Couldn't save — please try again." };
    return { ok: true as const, id };
  });

export const liveStreamQuery = queryOptions({
  queryKey: ["live-stream-id"],
  queryFn: () => getLiveStreamId(),
  staleTime: 60_000,
});
