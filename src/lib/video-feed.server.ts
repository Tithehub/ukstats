import { BROADCAST_CHANNELS } from "./broadcast-channels.data";
import { orderFeed, parsePlaylistItems, parseVideoStatus, parseYoutubeRss, type FeedItem, type FeedPayload } from "./video-feed";

const ID = "video-feed-v1";
const TTL = 5 * 60_000;
const BATCH = 20;
const KEEP_HOURS = 48;
const CHANNELS = Object.entries(BROADCAST_CHANNELS).flatMap(([country, list]) => list.map((c) => ({ ...c, country })));

let mem: FeedPayload | null = null;
let inflight: Promise<FeedPayload> | null = null;

async function get(url: string, ms = 8_000): Promise<Response | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { "user-agent": "Mozilla/5.0 (compatible; UKStats/1.0)" } });
    if (!r.ok) { await r.body?.cancel(); return null; }
    return r;
  } catch { return null; }
}

async function collect(prev: FeedPayload | null): Promise<FeedPayload> {
  const key = process.env["YOUTUBE_API_KEY"];
  const start = (prev?.cursor ?? 0) % CHANNELS.length;
  const batch = Array.from({ length: Math.min(BATCH, CHANNELS.length) }, (_, i) => CHANNELS[(start + i) % CHANNELS.length]!);
  const answered = new Set<string>();
  const fresh: FeedItem[] = [];
  await Promise.all(batch.map(async (ch) => {
    let items: FeedItem[] | null = null;
    if (key) {
      const r = await get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=8&playlistId=UU${ch.channelId.slice(2)}&key=${key}`);
      if (r) items = parsePlaylistItems(await r.json().catch(() => null), ch);
    } else {
      const r = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`);
      if (r) items = parseYoutubeRss(await r.text(), ch);
    }
    if (items) { answered.add(ch.channelId); fresh.push(...items); }
  }));
  // Keep previous items for channels not refreshed (or not answering) this round.
  const kept = (prev?.items ?? []).filter((i) => !answered.has(i.channelId));
  const cut = Date.now() - KEEP_HOURS * 3_600_000;
  let items = [...fresh, ...kept].filter((i) => i.live || Date.parse(i.published) >= cut);
  if (key && fresh.length) {
    const ids = fresh.map((i) => i.id);
    for (let i = 0; i < ids.length; i += 50) {
      const r = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids.slice(i, i + 50).join(",")}&key=${key}`);
      if (!r) continue;
      const st = parseVideoStatus(await r.json().catch(() => null));
      items = items.map((x) => { const s = st.get(x.id); return s ? { ...x, ...s } : x; });
    }
  }
  const connected = answered.size > 0 || !!prev?.connected;
  return {
    items: orderFeed(items).slice(0, 300), fetchedAt: new Date().toISOString(), connected,
    error: answered.size ? null : key ? "YouTube did not answer this round" : "Feed not connected yet",
    cursor: (start + batch.length) % CHANNELS.length,
  };
}

async function readStored(): Promise<FeedPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: FeedPayload } } | null;
    return r?.data?.data?.fetchedAt ? r.data.data : null;
  } catch { return null; }
}

function refresh(prev: FeedPayload | null): Promise<FeedPayload> {
  if (inflight) return inflight;
  inflight = collect(prev).then(async (d) => {
    mem = d;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: d.fetchedAt });
    } catch { /* keep in memory */ }
    return d;
  }).finally(() => { inflight = null; });
  return inflight;
}

/** Serves the last good copy; refreshes one batch of channels when older than five minutes. */
export async function loadVideoFeed(): Promise<FeedPayload> {
  if (!mem) mem = await readStored();
  if (mem && Date.now() - Date.parse(mem.fetchedAt) < TTL) return mem;
  if (mem) { void refresh(mem).catch(() => {}); return mem; }
  return refresh(null);
}
