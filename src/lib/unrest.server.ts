import { FCDO_INDEX, STATE_DEPT_FEED, parseAcled, parseFcdo, parseFcdoAlert, parseStateDept, type AcledEvent, type FcdoAlertEntry, type OfficialWarning, type UnrestPayload } from "./unrest";

/** FCDO country pages checked per refresh: keeps each run well inside edge subrequest limits; the full set cycles in about 90 minutes. */
const ALERT_BATCH = 40;

async function fcdoAlerts(warnings: OfficialWarning[], prev: Record<string, FcdoAlertEntry> | undefined): Promise<Record<string, FcdoAlertEntry>> {
  const out: Record<string, FcdoAlertEntry> = { ...(prev ?? {}) };
  const todo = warnings.filter((w) => w.source === "FCDO").sort((a, b) => (out[a.key]?.checked ?? "").localeCompare(out[b.key]?.checked ?? "")).slice(0, ALERT_BATCH);
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const w = todo[i++]!;
      try {
        const st = parseFcdoAlert(await json(w.url.replace("https://www.gov.uk/", "https://www.gov.uk/api/content/")));
        if (st) out[w.key] = { status: st, updated: w.updated, url: w.url, checked: new Date().toISOString() };
      } catch { /* keep the last checked status; unanswered pages stay unchecked */ }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

const TTL = 15 * 60_000;
const ID = "unrest-v1";
let mem: UnrestPayload | null = null;

async function json(url: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`${url} ${r.status}`); }
  return r.json();
}

async function acled(): Promise<UnrestPayload["acled"]> {
  const email = process.env["ACLED_EMAIL"], password = process.env["ACLED_PASSWORD"];
  if (!email || !password) return { connected: false, events: [] };
  try {
    const tok = (await json("https://acleddata.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password, grant_type: "password", client_id: "acled" }),
    })) as { access_token?: string };
    if (!tok.access_token) return { connected: false, events: [], error: "ACLED sign-in refused" };
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const q = new URLSearchParams({ _format: "json", event_type: "Riots:OR:event_type=Protests", event_date: since, event_date_where: ">=", limit: "3000", fields: "event_id_cnty|event_date|event_type|sub_event_type|country|location|latitude|longitude|actor1|fatalities|source" });
    const auth = { headers: { Authorization: `Bearer ${tok.access_token}` } };
    try {
      return { connected: true, events: parseAcled(await json(`https://acleddata.com/api/acled/read?${q}`, auth)) };
    } catch (e) {
      if (!String(e).includes(" 403")) throw e;
      // Refused: run ACLED's own documented example to tell "no access" from "our filters refused".
      const probe = await fetch("https://acleddata.com/api/acled/read?limit=10", { ...auth, signal: AbortSignal.timeout(15_000) });
      await probe.body?.cancel();
      if (probe.status === 403) return { connected: false, events: [], error: "ACLED account has no data access yet" };
      if (probe.ok) return { connected: true, events: [], error: "ACLED refused this request's filters" };
      throw e;
    }
  } catch (e) {
    console.error("ACLED", e);
    return { connected: true, events: [], error: "ACLED did not answer" };
  }
}

async function collect(prev: UnrestPayload | null): Promise<UnrestPayload> {
  const [f, s, a] = await Promise.all([json(FCDO_INDEX).then(parseFcdo).catch(() => null), json(STATE_DEPT_FEED).then(parseStateDept).catch(() => null), acled()]);
  if (!f && !s) throw new Error("No official warning feed answered");
  const alerts = f ? await fcdoAlerts(f, prev?.fcdoAlerts) : prev?.fcdoAlerts;
  return { warnings: [...(f ?? []), ...(s ?? [])], fcdoOk: !!f, stateOk: !!s, acled: a, ...(alerts ? { fcdoAlerts: alerts } : {}), fetchedAt: new Date().toISOString() };
}

async function readStored(): Promise<UnrestPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: UnrestPayload } } | null;
    return r?.data?.data?.warnings?.length ? r.data.data : null;
  } catch { return null; }
}

function refresh(prev: UnrestPayload | null): Promise<UnrestPayload> {
  return collect(prev).then((d) => {
    mem = d;
    import("@/integrations/supabase/client.server")
      .then(({ supabaseAdmin }) => (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: d.fetchedAt }))
      .catch(() => {});
    return d;
  });
}

/** Last good copy served at once; refreshed when older than an hour. */
export async function loadUnrest(): Promise<UnrestPayload | null> {
  const good = mem ?? (await readStored());
  // A copy saved before the ACLED login existed is out of date once it does.
  const acledNew = !!process.env["ACLED_EMAIL"] && good?.acled.connected === false && !good.acled.error;
  if (good && !acledNew && Date.now() - Date.parse(good.fetchedAt) < TTL) { mem = good; return good; }
  const pending = refresh(good).catch(() => null);
  return good ?? pending;
}
