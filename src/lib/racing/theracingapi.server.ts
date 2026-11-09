/** The Racing API client (server only). Free plan: racecards for today and tomorrow. Last good copy kept in payload_cache. */
import type { MeetingRow } from "./racing.functions";
import { mapRacecards, type TraRace } from "./theracingapi";

const ID = "racing-cards-v1";
const TTL = 30 * 60_000;
export interface LiveCards { fetchedAt: string; meetings: MeetingRow[]; error: string | null }
let mem: LiveCards | null = null;
let inflight: Promise<LiveCards> | null = null;

export const racingApiConfigured = () => !!(process.env["RACING_API_USERNAME"] && process.env["RACING_API_PASSWORD"]);

async function fetchDay(day: "today" | "tomorrow"): Promise<TraRace[]> {
  const auth = btoa(`${process.env["RACING_API_USERNAME"]}:${process.env["RACING_API_PASSWORD"]}`);
  const res = await fetch(`https://api.theracingapi.com/v1/racecards/free?day=${day}&region_codes=gb&region_codes=ire`, { headers: { Authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) { await res.body?.cancel(); throw new Error(`Racing API ${res.status}`); }
  return ((await res.json()) as { racecards?: TraRace[] }).racecards ?? [];
}

async function admin() { const { supabaseAdmin } = await import("@/integrations/supabase/client.server"); return supabaseAdmin.from as (t: string) => any; }

async function readStored(): Promise<LiveCards | null> {
  try { const from = await admin(); const { data } = await from("payload_cache").select("data").eq("id", ID).maybeSingle(); return data?.data?.fetchedAt ? data.data : null; } catch { return null; }
}

function refresh(prev: LiveCards | null): Promise<LiveCards> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const today = await fetchDay("today");
      const tomorrow = await fetchDay("tomorrow"); // sequential: the free plan rate-limits parallel calls
      const d: LiveCards = { fetchedAt: new Date().toISOString(), meetings: mapRacecards([...today, ...tomorrow]), error: null };
      mem = d;
      try { const from = await admin(); await from("payload_cache").upsert({ id: ID, data: d, updated_at: d.fetchedAt }); } catch { /* memory only */ }
      return d;
    } catch {
      if (prev) return (mem = { ...prev, error: "The Racing API did not answer; showing the last racecards received" });
      return { fetchedAt: new Date().toISOString(), meetings: [], error: "The Racing API did not answer" };
    }
  })().finally(() => { inflight = null; });
  return inflight;
}

export async function loadLiveCards(): Promise<LiveCards> {
  if (!mem) mem = await readStored();
  if (mem && Date.now() - Date.parse(mem.fetchedAt) < TTL) return mem;
  return refresh(mem);
}
