import { WORLD_WELLBEING_CACHE_ID, markRanked, parseEurostatLifeSat, type WellbeingList, type WorldWellbeingPayload } from "./world-wellbeing";
import { WHR_ROWS, WHR_SNAPSHOT } from "./world-wellbeing.data";

const ES_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_pw01?format=JSON&isced11=TOTAL&sex=T&age=Y_GE16&statinfo=AVG&lang=EN";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as { from: (t: string) => any };
}

function research(): WellbeingList {
  return {
    kind: "research",
    source: { name: WHR_SNAPSHOT.name, url: WHR_SNAPSHOT.url, period: WHR_SNAPSHOT.period, published: WHR_SNAPSHOT.published },
    rows: markRanked(WHR_ROWS.map(([name, score]) => ({ id: name, name, score, year: 2024, ranked: true }))),
  };
}

async function official(): Promise<WellbeingList> {
  const r = await fetch(ES_URL, { headers: { "user-agent": "UKStats/1.0 (+https://ukstats.co.uk)" } });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`Eurostat ${r.status}`); }
  const js = await r.json();
  const rows = parseEurostatLifeSat(js);
  if (!rows.length) throw new Error("Eurostat returned no rows");
  const years = rows.map((x) => x.year ?? 0);
  return {
    kind: "official",
    source: { name: "Eurostat — Overall life satisfaction (EU-SILC, ilc_pw01)", url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_pw01/default/table", period: `Latest survey year per country (newest ${Math.max(...years)})`, published: typeof js.updated === "string" ? js.updated.slice(0, 10) : null },
    rows,
  };
}

export async function readWorldWellbeing(): Promise<WorldWellbeingPayload | null> {
  const { data } = await (await admin()).from("payload_cache").select("data").eq("id", WORLD_WELLBEING_CACHE_ID).maybeSingle();
  return (data?.data as WorldWellbeingPayload | undefined) ?? null;
}

export async function refreshWorldWellbeing(): Promise<WorldWellbeingPayload> {
  const prev = await readWorldWellbeing().catch(() => null);
  const errors: string[] = [];
  let off: WellbeingList | null = null;
  try { off = await official(); } catch (e) { errors.push(String(e)); off = prev?.official ?? null; }
  const payload: WorldWellbeingPayload = { fetchedAt: new Date().toISOString(), official: off, research: research(), errors };
  await (await admin()).from("payload_cache").upsert({ id: WORLD_WELLBEING_CACHE_ID, data: payload, updated_at: payload.fetchedAt });
  return payload;
}

export async function loadWorldWellbeing(): Promise<WorldWellbeingPayload> {
  return (await readWorldWellbeing()) ?? refreshWorldWellbeing();
}
