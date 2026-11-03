import { unzipSync, strFromU8 } from "fflate";
import { parseCbp, parseFrontex, parseUnhcr, xlsxRows, type MigrationPayload } from "./migration-flows";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; UKStats/1.0; +https://ukstats.co.uk)" };
const TTL = 24 * 3600_000;
const ID = "migration-flows-v1";
let mem: { at: number; data: MigrationPayload } | null = null;

async function frontex() {
  const page = "https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/";
  const html = await (await fetch(page, { headers: UA, signal: AbortSignal.timeout(15_000) })).text();
  const href = html.match(/href="([^"]*Monthly_detections_of_IBC[^"]*\.xlsx)"/i)?.[1];
  if (!href) throw new Error("File link not found on Frontex page");
  const url = new URL(href, page).toString();
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`Frontex file ${res.status}`);
  const f = unzipSync(new Uint8Array(await res.arrayBuffer()), { filter: (x) => x.name === "xl/worksheets/sheet1.xml" || x.name === "xl/sharedStrings.xml" });
  const sheet = f["xl/worksheets/sheet1.xml"], shared = f["xl/sharedStrings.xml"];
  if (!sheet || !shared) throw new Error("Frontex file unreadable");
  const d = parseFrontex(xlsxRows(strFromU8(sheet), strFromU8(shared)), url);
  if (!d) throw new Error("Frontex layout changed");
  return d;
}

async function cbp() {
  const page = "https://www.cbp.gov/document/stats/nationwide-encounters";
  const html = await (await fetch(page, { headers: UA, signal: AbortSignal.timeout(15_000) })).text();
  const href = html.match(/(\/sites\/default\/files\/[^"]*nationwide-encounters[^"]*-aor[^"]*\.csv)/i)?.[1];
  if (!href) throw new Error("CSV link not found on CBP page");
  const url = new URL(href, page).toString();
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`CBP file ${res.status}`);
  const d = parseCbp(await res.text(), url);
  if (!d) throw new Error("CBP layout changed");
  return d;
}

async function unhcr() {
  const now = new Date().getUTCFullYear();
  for (const year of [now - 1, now - 2]) {
    const r = await fetch(`https://api.unhcr.org/population/v1/population/?limit=10000&year=${year}&coo_all=true&coa_all=true`, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) continue;
    const d = parseUnhcr(((await r.json()) as { items?: unknown }).items, year);
    if (d) return d;
  }
  throw new Error("UNHCR returned no data");
}

const settle = async <T,>(p: Promise<T>): Promise<[T | null, string | null]> => { try { return [await p, null]; } catch (e) { return [null, e instanceof Error ? e.message : "Unavailable"]; } };

async function collect(prev: MigrationPayload | null): Promise<MigrationPayload> {
  const [[f, fe], [c, ce], [u, ue]] = await Promise.all([settle(frontex()), settle(cbp()), settle(unhcr())]);
  const errors: MigrationPayload["errors"] = {};
  if (fe) errors.frontex = fe; if (ce) errors.cbp = ce; if (ue) errors.unhcr = ue;
  // Keep a source's last good figures if it fails this time; its own dates stay attached.
  return { frontex: f ?? prev?.frontex ?? null, cbp: c ?? prev?.cbp ?? null, unhcr: u ?? prev?.unhcr ?? null, errors, fetchedAt: new Date().toISOString() };
}

async function readStored(): Promise<MigrationPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: MigrationPayload } } | null;
    return r?.data?.data?.fetchedAt ? r.data.data : null;
  } catch { return null; }
}
function store(d: MigrationPayload) {
  import("@/integrations/supabase/client.server")
    .then(({ supabaseAdmin }) => (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: new Date().toISOString() }))
    .catch(() => {});
}

export async function loadMigrationFlows(): Promise<MigrationPayload | null> {
  if (mem && Date.now() - mem.at < TTL) return mem.data;
  const good = mem?.data ?? (await readStored());
  if (good && Date.now() - Date.parse(good.fetchedAt) < TTL) { mem = { at: Date.parse(good.fetchedAt), data: good }; return good; }
  const pending = collect(good).then((d) => { mem = { at: Date.now(), data: d }; if (d.frontex || d.cbp || d.unhcr) store(d); return d; }).catch(() => null);
  return good ?? pending;
}
