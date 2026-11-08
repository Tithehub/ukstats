import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { channelIdFrom, cleanLink, type Journalist } from "./citizen-journalists";

const COLS = "id,name,bio,photo_url,youtube_channel_id,youtube_url,x_url,rumble_url,substack_url,website_url";

async function publicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  }) as unknown as { from: (t: string) => any };
}

export interface VideoItem { id: string; title: string; published: string }
export type PublicJournalist = Journalist & { videos: VideoItem[] };

const unesc = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
async function latestVideos(channelId: string): Promise<VideoItem[]> {
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) { await r.body?.cancel(); return []; }
    const xml = await r.text();
    return xml.split("<entry>").slice(1, 4).flatMap((e) => {
      const id = /<yt:videoId>([^<]+)</.exec(e)?.[1]; const title = /<title>([^<]*)</.exec(e)?.[1]; const pub = /<published>([^<]+)</.exec(e)?.[1];
      return id && title && pub ? [{ id, title: unesc(title), published: pub }] : [];
    });
  } catch { return []; }
}

export const listCitizenJournalists = createServerFn({ method: "POST" }).handler(async (): Promise<PublicJournalist[]> => {
  const sb = await publicClient();
  const { data, error } = await sb.from("citizen_journalists").select(COLS).eq("status", "approved").order("name");
  if (error) throw new Error("Could not load the directory");
  const rows = (data ?? []) as Journalist[];
  return Promise.all(rows.map(async (j) => ({ ...j, videos: j.youtube_channel_id ? await latestVideos(j.youtube_channel_id) : [] })));
});
export const citizenJournalistsQuery = queryOptions({ queryKey: ["citizen-journalists"], queryFn: () => listCitizenJournalists(), staleTime: 10 * 60_000 });

export interface ApplicationInput {
  name: string; bio: string; photo_url?: string; youtube_url?: string; x_url?: string; rumble_url?: string; substack_url?: string; website_url?: string;
}
function clean(d: ApplicationInput) {
  const name = String(d.name ?? "").trim().slice(0, 80);
  if (name.length < 2) throw new Error("Please enter a name");
  const photo = (d.photo_url ?? "").trim();
  if (photo && !/^https:\/\//.test(photo)) throw new Error("Photo link must start with https://");
  const youtube_url = cleanLink("youtube", d.youtube_url);
  const row = {
    name, bio: String(d.bio ?? "").trim().slice(0, 600), photo_url: photo || null,
    youtube_url, youtube_channel_id: channelIdFrom(youtube_url),
    x_url: cleanLink("x", d.x_url), rumble_url: cleanLink("rumble", d.rumble_url),
    substack_url: cleanLink("substack", d.substack_url), website_url: cleanLink("website", d.website_url),
  };
  if (!row.youtube_url && !row.x_url && !row.rumble_url && !row.substack_url && !row.website_url) throw new Error("Add at least one link");
  return row;
}

export const applyCitizenJournalist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ApplicationInput) => d)
  .handler(async ({ data, context }) => {
    const row = clean(data);
    const { error } = await (context.supabase as any).from("citizen_journalists").insert({ ...row, user_id: context.userId, status: "pending" });
    if (error) throw new Error("Could not send your application");
    return { ok: true };
  });

export const myCitizenApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any).from("citizen_journalists").select("id,name,status,review_note,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
    return (data ?? []) as { id: string; name: string; status: string; review_note: string | null; created_at: string }[];
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data !== true) throw new Error("Admins only");
}

export const adminCitizenList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await (context.supabase as any).from("citizen_journalists").select(`${COLS},status,review_note,created_at`).order("created_at", { ascending: false });
    return (data ?? []) as (Journalist & { status: string; review_note: string | null; created_at: string })[];
  });

export const adminAddCitizen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ApplicationInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (context.supabase as any).from("citizen_journalists").insert({ ...clean(data), status: "approved" });
    if (error) throw new Error("Could not add");
    return { ok: true };
  });

export const adminReviewCitizen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "pending" | "delete"; note?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const t = (context.supabase as any).from("citizen_journalists");
    const { error } = data.status === "delete"
      ? await t.delete().eq("id", data.id)
      : await t.update({ status: data.status, review_note: data.note?.slice(0, 300) || null }).eq("id", data.id);
    if (error) throw new Error("Could not update");
    return { ok: true };
  });
