/** Pure mappers for The Racing API racecards (free plan: today and tomorrow, no results or odds). */
import { RACECOURSES } from "./racecourses.data";
import type { MeetingRow, RaceRow, RunnerRow } from "./racing.functions";

export interface TraRunner { horse: string; horse_id: string; age?: string; sex_code?: string; sire?: string; dam?: string; region?: string; trainer?: string; trainer_id?: string; jockey?: string; jockey_id?: string; number?: string; draw?: string; headgear?: string; lbs?: string; ofr?: string; form?: string }
export interface TraRace { race_id: string; course: string; date: string; off_dt: string; race_name: string; distance_f?: string; region?: string; race_class?: string; type?: string; field_size?: string; going?: string; surface?: string; race_status?: string; runners: TraRunner[] }

const num = (v: string | undefined) => { const n = Number(v); return v != null && v !== "" && Number.isFinite(n) ? n : null; };
/** "Wolverhampton (AW)" → the matching real UK course, or null when the course is not in the UK. */
export function ukCourse(name: string) {
  const base = name.replace(/\s*\((AW|IRE|GB)\)\s*$/i, "").trim().toLowerCase();
  return RACECOURSES.find((c) => c.name.toLowerCase() === base || c.name.toLowerCase().replace(/ (park|city|downs)$/, "") === base) ?? null;
}
export const furlongsToYards = (f: string | undefined) => { const n = num(f); return n == null ? null : Math.round(n * 220); };

export function mapRacecards(races: TraRace[]): MeetingRow[] {
  const byMeeting = new Map<string, MeetingRow>();
  for (const r of races) {
    const course = ukCourse(r.course); if (!course) continue;
    const key = `${course.id}|${r.date}`;
    const m = byMeeting.get(key) ?? { id: `tra-${key}`, meeting_date: r.date, going: r.going || null, surface: r.surface === "AW" ? "All-weather" : r.surface ? "Turf" : null, status: "scheduled", course: { id: course.id, name: course.name }, races: [] };
    const runners: RunnerRow[] = r.runners.map((x) => ({
      id: `${r.race_id}-${x.horse_id}`, cloth_number: num(x.number), draw: num(x.draw) || null, age: num(x.age), weight_lbs: num(x.lbs), official_rating: num(x.ofr), form: x.form || null, headgear: x.headgear || null, non_runner: false,
      horse: { id: x.horse_id, name: x.horse, sex: x.sex_code?.toLowerCase() || null }, trainer: x.trainer_id ? { id: x.trainer_id, name: x.trainer ?? "" } : null, jockey: x.jockey_id ? { id: x.jockey_id, name: x.jockey ?? "" } : null,
    }));
    const race: RaceRow = { id: r.race_id, off_time: r.off_dt, name: r.race_name, race_type: r.type || null, distance_yards: furlongsToYards(r.distance_f), class: r.race_class?.replace(/^Class\s*/i, "") || null, prize_gbp: null, going: r.going || null, field_size: num(r.field_size), status: r.race_status === "declared" || !r.race_status ? "scheduled" : r.race_status, runners };
    m.races.push(race); byMeeting.set(key, m);
  }
  return [...byMeeting.values()].map((m) => ({ ...m, races: m.races.sort((a, b) => a.off_time.localeCompare(b.off_time)) })).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date) || (a.course?.name ?? "").localeCompare(b.course?.name ?? ""));
}
