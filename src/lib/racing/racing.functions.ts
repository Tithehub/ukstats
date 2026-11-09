import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dayWindow, londonDate, type RaceDay } from "./racing";
import { RACING_DEMO } from "./providers/types";
import { demoHorse, demoHorseList, demoMeetings, demoPeople, demoPerson, demoResults } from "./demo.data";

async function db() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
  }) as unknown as { from: (t: string) => any };
}

export interface Source { id: string; name: string; kind: string; status: string; last_success_at: string | null; last_error: string | null; records_imported: number }
export interface RunnerRow { id: string; cloth_number: number | null; draw: number | null; age: number | null; weight_lbs: number | null; official_rating: number | null; form: string | null; headgear: string | null; non_runner: boolean; horse: { id: string; name: string; sex: string | null } | null; trainer: { id: string; name: string } | null; jockey: { id: string; name: string } | null }
export interface RaceRow { id: string; off_time: string; name: string; race_type: string | null; distance_yards: number | null; class: string | null; prize_gbp: number | null; going: string | null; field_size: number | null; status: string; runners: RunnerRow[] }
export interface MeetingRow { id: string; meeting_date: string; going: string | null; surface: string | null; status: string; course: { id: string; name: string } | null; races: RaceRow[] }
export interface Racecards { sources: Source[]; meetings: MeetingRow[]; latestOdds: string | null; error: string | null }

const RACE_SEL = "id,off_time,name,race_type,distance_yards,class,prize_gbp,going,field_size,status,runners(id,cloth_number,draw,age,weight_lbs,official_rating,form,headgear,non_runner,horse:horses(id,name,sex),trainer:trainers(id,name),jockey:jockeys(id,name))";

export const getRacecards = createServerFn({ method: "POST" })
  .inputValidator((d: { day: RaceDay }) => ({ day: (["today", "tomorrow", "upcoming"] as const).includes(d.day) ? d.day : "today" as RaceDay }))
  .handler(async ({ data }): Promise<Racecards> => {
    if (RACING_DEMO) { const w = dayWindow(data.day, new Date()); return { sources: [], meetings: demoMeetings(w.from, w.to), latestOdds: null, error: null }; }
    try {
      const c = await db();
      const w = dayWindow(data.day, new Date());
      const [src, mt, od] = await Promise.all([
        c.from("racing_data_sources").select("id,name,kind,status,last_success_at,last_error,records_imported"),
        c.from("meetings").select(`id,meeting_date,going,surface,status,course:racecourses(id,name),races(${RACE_SEL})`).gte("meeting_date", w.from).lte("meeting_date", w.to).order("meeting_date"),
        c.from("odds_snapshots").select("captured_at").order("captured_at", { ascending: false }).limit(1),
      ]);
      const meetings = ((mt.data ?? []) as MeetingRow[]).map((m) => ({ ...m, races: [...m.races].sort((a, b) => a.off_time.localeCompare(b.off_time)) }));
      return { sources: src.data ?? [], meetings, latestOdds: od.data?.[0]?.captured_at ?? null, error: mt.error ? "Racing data unavailable" : null };
    } catch { return { sources: [], meetings: [], latestOdds: null, error: "Racing data unavailable" }; }
  });
export const racecardsQuery = (day: RaceDay) => queryOptions({ queryKey: ["racing", "cards", day], queryFn: () => getRacecards({ data: { day } }), staleTime: 60_000 });

export interface ResultRow { race_id: string; position: number | null; status: string; starting_price_decimal: number | null; horse: { id: string; name: string } | null; race: { name: string; off_time: string; meeting: { course: { name: string } | null } | null } | null }
export const getResults = createServerFn({ method: "POST" }).handler(async () => {
  if (RACING_DEMO) return { rows: demoResults(), error: null };
  try {
    const c = await db();
    const since = londonDate(new Date(), -7);
    const { data, error } = await c.from("race_results").select("race_id,position,status,starting_price_decimal,horse:horses(id,name),race:races!inner(name,off_time,meeting:meetings(course:racecourses(name)))").gte("race.off_time", since).order("recorded_at", { ascending: false }).limit(300);
    return { rows: (data ?? []) as ResultRow[], error: error ? "Results unavailable" : null };
  } catch { return { rows: [] as ResultRow[], error: "Results unavailable" }; }
});
export const resultsQuery = () => queryOptions({ queryKey: ["racing", "results"], queryFn: () => getResults(), staleTime: 60_000 });

export interface CareerRun { race_id: string; off_time: string; race: string; course: string | null; distance_yards: number | null; going: string | null; position: number | null; status: string | null; sp: number | null; weight_lbs: number | null; rating: number | null }
export const getHorse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id).slice(0, 80) }))
  .handler(async ({ data }) => {
    if (RACING_DEMO) return demoHorse(data.id);
    const c = await db();
    const { data: h } = await c.from("horses").select("id,name,foaled,sex,sire,dam,country,trainer:trainers(id,name),aliases:horse_aliases(alias)").eq("id", data.id).maybeSingle();
    if (!h) return null;
    const [{ data: runs }, { data: res }] = await Promise.all([
      c.from("runners").select("race_id,weight_lbs,official_rating,race:races(name,off_time,distance_yards,going,meeting:meetings(course:racecourses(name)))").eq("horse_id", data.id),
      c.from("race_results").select("race_id,position,status,starting_price_decimal").eq("horse_id", data.id),
    ]);
    const byRace = new Map(((res ?? []) as any[]).map((r) => [r.race_id, r]));
    const career: CareerRun[] = ((runs ?? []) as any[]).filter((r) => r.race).map((r) => {
      const x = byRace.get(r.race_id);
      return { race_id: r.race_id, off_time: r.race.off_time, race: r.race.name, course: r.race.meeting?.course?.name ?? null, distance_yards: r.race.distance_yards, going: r.race.going, position: x?.position ?? null, status: x?.status ?? null, sp: x?.starting_price_decimal ?? null, weight_lbs: r.weight_lbs, rating: r.official_rating };
    }).sort((a, b) => b.off_time.localeCompare(a.off_time));
    return { horse: h as { id: string; name: string; foaled: string | null; sex: string | null; sire: string | null; dam: string | null; country: string | null; trainer: { id: string; name: string } | null; aliases: { alias: string }[] }, career };
  });
export const horseQuery = (id: string) => queryOptions({ queryKey: ["racing", "horse", id], queryFn: () => getHorse({ data: { id } }) });

export const searchHorses = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string }) => ({ q: String(d.q ?? "").replace(/[%_,()]/g, "").slice(0, 60) }))
  .handler(async ({ data }) => {
    if (RACING_DEMO) return { rows: demoHorseList(data.q), error: null };
    try {
      const c = await db();
      let q = c.from("horses").select("id,name,sex,foaled,trainer:trainers(name)").order("name").limit(100);
      if (data.q) q = q.ilike("name", `%${data.q}%`);
      const { data: rows, error } = await q;
      return { rows: (rows ?? []) as { id: string; name: string; sex: string | null; foaled: string | null; trainer: { name: string } | null }[], error: error ? "Horse database unavailable" : null };
    } catch { return { rows: [], error: "Horse database unavailable" }; }
  });
export const horsesQuery = (q: string) => queryOptions({ queryKey: ["racing", "horses", q], queryFn: () => searchHorses({ data: { q } }) });

export type PersonKind = "trainer" | "jockey";
export const getPerson = createServerFn({ method: "POST" })
  .inputValidator((d: { kind: PersonKind; id: string }) => ({ kind: d.kind === "jockey" ? "jockey" as const : "trainer" as const, id: String(d.id).slice(0, 80) }))
  .handler(async ({ data }) => {
    if (RACING_DEMO) return demoPerson(data.kind, data.id);
    const c = await db();
    const { data: p } = await c.from(data.kind === "jockey" ? "jockeys" : "trainers").select("id,name").eq("id", data.id).maybeSingle();
    if (!p) return null;
    const col = data.kind === "jockey" ? "jockey_id" : "trainer_id";
    const { data: runs } = await c.from("runners").select("race_id,horse_id,horse:horses(name),race:races(off_time,name,meeting:meetings(course:racecourses(name)))").eq(col, data.id).limit(2000);
    const ids = [...new Set(((runs ?? []) as any[]).map((r) => r.race_id))];
    const { data: res } = ids.length ? await c.from("race_results").select("race_id,horse_id,position").in("race_id", ids.slice(0, 500)) : { data: [] };
    const pos = new Map(((res ?? []) as any[]).map((r) => [`${r.race_id}|${r.horse_id}`, r.position as number | null]));
    const rows = ((runs ?? []) as any[]).filter((r) => r.race).map((r) => ({ off_time: r.race.off_time as string, race: r.race.name as string, course: (r.race.meeting?.course?.name ?? "Unknown course") as string, horse: (r.horse?.name ?? "") as string, horse_id: r.horse_id as string, position: pos.get(`${r.race_id}|${r.horse_id}`) ?? null }))
      .sort((a, b) => b.off_time.localeCompare(a.off_time));
    return { person: p as { id: string; name: string }, rows };
  });
export const personQuery = (kind: PersonKind, id: string) => queryOptions({ queryKey: ["racing", kind, id], queryFn: () => getPerson({ data: { kind, id } }) });

export const searchPeople = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string }) => ({ q: String(d.q ?? "").replace(/[%_,()]/g, "").slice(0, 60) }))
  .handler(async ({ data }) => {
    if (RACING_DEMO) return { ...demoPeople(data.q), error: null };
    try {
      const c = await db();
      const run = (t: string) => { let q = c.from(t).select("id,name").order("name").limit(60); if (data.q) q = q.ilike("name", `%${data.q}%`); return q; };
      const [t, j] = await Promise.all([run("trainers"), run("jockeys")]);
      return { trainers: (t.data ?? []) as { id: string; name: string }[], jockeys: (j.data ?? []) as { id: string; name: string }[], error: t.error || j.error ? "Unavailable" : null };
    } catch { return { trainers: [], jockeys: [], error: "Unavailable" }; }
  });
export const peopleQuery = (q: string) => queryOptions({ queryKey: ["racing", "people", q], queryFn: () => searchPeople({ data: { q } }) });

export const racingAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase as any;
    const { data: ok } = await s.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (ok !== true) return { allowed: false as const };
    const [src, logs, audit] = await Promise.all([
      s.from("racing_data_sources").select("*"),
      s.from("racing_import_logs").select("*").order("started_at", { ascending: false }).limit(50),
      s.from("racing_audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    return { allowed: true as const, sources: (src.data ?? []) as Source[], logs: (logs.data ?? []) as { id: string; job: string; status: string; records: number; error: string | null; started_at: string }[], audit: (audit.data ?? []) as { id: string; entity: string; entity_id: string; action: string; reason: string | null; created_at: string }[] };
  });
