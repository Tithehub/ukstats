import { unzipSync, strFromU8 } from "fflate";
import { mergeRecent, parseLast7DaysHtml, parseSmallBoatsXml, type BoatDay, type DayRow } from "./small-boats";

export type SmallBoatsPayload = { series: BoatDay[]; days?: DayRow[]; recentPublished?: string | null; fileUrl: string; published: string | null; fetchedAt: string } | null;

const API = "https://www.gov.uk/api/content/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats";
const LAST7 = API + "/migrants-detected-crossing-the-english-channel-in-small-boats-last-7-days";
export const LAST7_PAGE = "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats/migrants-detected-crossing-the-english-channel-in-small-boats-last-7-days";

/** Daily last-7-days figures; null if unreadable, so the page falls back to the weekly series alone. */
async function recent(): Promise<{ rows: BoatDay[]; published: string | null } | null> {
  try {
    const r = await fetch(LAST7, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { public_updated_at?: string; details?: { body?: string } };
    return { rows: parseLast7DaysHtml(j.details?.body ?? ""), published: j.public_updated_at ?? null };
  } catch {
    return null;
  }
}

const TTL = 3600_000;
let mem: { at: number; data: SmallBoatsPayload } | null = null;

async function collect(): Promise<SmallBoatsPayload> {
  const recentP = recent();
  const meta = (await (await fetch(API, { signal: AbortSignal.timeout(15_000) })).json()) as {
    public_updated_at?: string;
    details?: { attachments?: { url?: string; content_type?: string }[] };
  };
  const att = meta.details?.attachments?.find((a) => a.content_type === "application/vnd.oasis.opendocument.spreadsheet" && a.url);
  if (!att?.url) throw new Error("Time series spreadsheet not listed");
  const res = await fetch(att.url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Spreadsheet ${res.status}`);
  const files = unzipSync(new Uint8Array(await res.arrayBuffer()), { filter: (f) => f.name === "content.xml" });
  const xml = files["content.xml"];
  if (!xml) throw new Error("Spreadsheet has no content");
  const series = parseSmallBoatsXml(strFromU8(xml));
  const rec = await recentP;
  return { series, days: rec ? mergeRecent(series, rec.rows) : series, recentPublished: rec?.published ?? null, fileUrl: att.url, published: meta.public_updated_at ?? null, fetchedAt: new Date().toISOString() };
}

async function readStored(): Promise<SmallBoatsPayload> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", "small-boats").maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: SmallBoatsPayload } } | null;
    const p = r?.data?.data;
    return p && Array.isArray(p.series) && p.series.length ? p : null;
  } catch {
    return null;
  }
}

function store(d: SmallBoatsPayload) {
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: "small-boats", data: d, updated_at: new Date().toISOString() }))
    .catch(() => {});
}

function refresh(): Promise<SmallBoatsPayload> {
  const p = collect().then((d) => {
    mem = { at: Date.now(), data: d };
    store(d);
    return d;
  });
  return p;
}

/** Last good official series, served instantly; refreshed in the background when stale. */
export async function loadSmallBoats(): Promise<SmallBoatsPayload> {
  if (mem && Date.now() - mem.at < TTL) return mem.data;
  const good = mem?.data ?? (await readStored());
  if (good && Date.now() - Date.parse(good.fetchedAt) < TTL) {
    mem = { at: Date.parse(good.fetchedAt), data: good };
    return good;
  }
  const pending = refresh().catch(() => null);
  return good ?? pending;
}
