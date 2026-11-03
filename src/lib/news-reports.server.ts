import { mergeReports, parsePoliceScotland, parseRss, toReports, type RawItem, type ReportsPayload } from "./news-reports";
import { UNREST_PLACES } from "./unrest-places.data";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; UKStats/1.0; +https://ukstats.co.uk)" };
const TTL = 10 * 60_000;
const ID = "news-reports-v1";
let mem: { at: number; data: ReportsPayload } | null = null;

const FEEDS: { name: string; url: string; official: boolean; html?: boolean }[] = [
  { name: "Police Scotland", url: "https://www.scotland.police.uk/what-s-happening/news/", official: true, html: true },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/scotland/rss.xml", official: false },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/uk/rss.xml", official: false },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml", official: false },
  { name: "The Guardian", url: "https://www.theguardian.com/uk/scotland/rss", official: false },
  { name: "The Guardian", url: "https://www.theguardian.com/world/europe-news/rss", official: false },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml", official: false },
];

async function one(f: (typeof FEEDS)[number]): Promise<RawItem[]> {
  const r = await fetch(f.url, { headers: UA, signal: AbortSignal.timeout(12_000) });
  if (!r.ok) { await r.body?.cancel(); throw new Error(String(r.status)); }
  const t = await r.text();
  return f.html ? parsePoliceScotland(t) : parseRss(t);
}

async function collect(): Promise<ReportsPayload> {
  const now = new Date();
  const res = await Promise.allSettled(FEEDS.map(one));
  const lists = res.map((r, i) => (r.status === "fulfilled" ? toReports(r.value, FEEDS[i]!.name, FEEDS[i]!.official, UNREST_PLACES, now) : []));
  const ok = new Map<string, boolean>();
  res.forEach((r, i) => ok.set(FEEDS[i]!.name, (ok.get(FEEDS[i]!.name) ?? false) || r.status === "fulfilled"));
  return { items: mergeReports(lists).slice(0, 150), sources: [...ok].map(([name, o]) => ({ name, ok: o })), fetchedAt: now.toISOString() };
}

async function readStored(): Promise<ReportsPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: ReportsPayload } } | null;
    return r?.data?.data?.fetchedAt ? r.data.data : null;
  } catch { return null; }
}
function store(d: ReportsPayload) {
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: new Date().toISOString() }))
    .catch(() => {});
}

export async function loadNewsReports(): Promise<ReportsPayload | null> {
  if (mem && Date.now() - mem.at < TTL) return mem.data;
  const good = mem?.data ?? (await readStored());
  if (good && Date.now() - Date.parse(good.fetchedAt) < TTL) { mem = { at: Date.parse(good.fetchedAt), data: good }; return good; }
  const pending = collect().then((d) => { mem = { at: Date.now(), data: d }; if (d.sources.some((s) => s.ok)) store(d); return d; }).catch(() => null);
  return good ?? pending;
}
