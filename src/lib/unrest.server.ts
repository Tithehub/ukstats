import { FCDO_INDEX, STATE_DEPT_FEED, parseAcled, parseFcdo, parseStateDept, type AcledEvent, type UnrestPayload } from "./unrest";

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
    const events: AcledEvent[] = parseAcled(await json(`https://acleddata.com/api/acled/read?${q}`, { headers: { Authorization: `Bearer ${tok.access_token}` } }));
    return { connected: true, events };
  } catch (e) {
    console.error("ACLED", e);
    // 403: the login works but the account has not been granted data access.
    if (String(e).includes(" 403")) return { connected: false, events: [], error: "ACLED account has no data access yet" };
    return { connected: true, events: [], error: "ACLED did not answer" };
  }
}

async function collect(): Promise<UnrestPayload> {
  const [f, s, a] = await Promise.all([json(FCDO_INDEX).then(parseFcdo).catch(() => null), json(STATE_DEPT_FEED).then(parseStateDept).catch(() => null), acled()]);
  if (!f && !s) throw new Error("No official warning feed answered");
  return { warnings: [...(f ?? []), ...(s ?? [])], fcdoOk: !!f, stateOk: !!s, acled: a, fetchedAt: new Date().toISOString() };
}

async function readStored(): Promise<UnrestPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: UnrestPayload } } | null;
    return r?.data?.data?.warnings?.length ? r.data.data : null;
  } catch { return null; }
}

function refresh(): Promise<UnrestPayload> {
  return collect().then((d) => {
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
  const acledNew = !!process.env["ACLED_EMAIL"] && good?.acled.connected === false;
  if (good && !acledNew && Date.now() - Date.parse(good.fetchedAt) < TTL) { mem = good; return good; }
  const pending = refresh().catch(() => null);
  return good ?? pending;
}
