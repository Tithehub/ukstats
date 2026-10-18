import { WORLD_INDICATORS, parseCountries, parseIndicator, type WorldPayload } from "./world";

const API = "https://api.worldbank.org/v2";
const TTL = 12 * 3600_000;
const ID = "world-bank-v2"; // bump when the indicator list changes
let mem: { at: number; data: WorldPayload } | null = null;
let inflight: Promise<WorldPayload> | null = null;

const get = async (url: string) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) {
    await r.body?.cancel();
    throw new Error(`World Bank ${r.status}`);
  }
  return r.json();
};

async function collect(): Promise<WorldPayload> {
  const countries = parseCountries(await get(`${API}/country?format=json&per_page=400`));
  if (countries.length < 150) throw new Error("Country list incomplete");
  const keep = new Set(countries.map((c) => c.iso3));
  const values: WorldPayload["values"] = {};
  const updated: WorldPayload["updated"] = {};
  await Promise.all(
    WORLD_INDICATORS.map(async (ind) => {
      const p = parseIndicator(await get(`${API}/country/all/indicator/${ind.id}?format=json&mrnev=1&per_page=400`), keep);
      values[ind.id] = p.values;
      updated[ind.id] = p.updated;
    }),
  );
  return { countries, values, updated, fetchedAt: new Date().toISOString() };
}

async function readStored(): Promise<WorldPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: WorldPayload } } | null;
    const p = r?.data?.data;
    return p && Array.isArray(p.countries) && p.countries.length ? p : null;
  } catch {
    return null;
  }
}

function store(d: WorldPayload) {
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: new Date().toISOString() }))
    .catch(() => {});
}

function refresh() {
  inflight ??= collect()
    .then((d) => {
      mem = { at: Date.now(), data: d };
      store(d);
      return d;
    })
    .finally(() => (inflight = null));
  return inflight;
}

/** Last good World Bank snapshot, served instantly; refreshed in the background when stale. */
export async function loadWorld(): Promise<WorldPayload | null> {
  if (mem && Date.now() - mem.at < TTL) return mem.data;
  const good = mem?.data ?? (await readStored());
  if (good && Date.now() - Date.parse(good.fetchedAt) < TTL) {
    mem = { at: Date.parse(good.fetchedAt), data: good };
    return good;
  }
  const pending = refresh().catch(() => null);
  return good ?? pending;
}
