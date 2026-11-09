/**
 * EXAMPLE racing data — invented horses, trainers and jockeys shown only while no licensed
 * provider is configured. Always labelled "Example" in the UI; never used in reports, stream or embeds.
 * Courses are real (racecourses.data.ts). No odds are ever generated.
 */
import { RACECOURSES } from "./racecourses.data";
import { londonDate } from "./racing";
import type { MeetingRow, RaceRow, RunnerRow, ResultRow, CareerRun } from "./racing.functions";

const HORSES = ["Harbour Lantern", "Copper Meadow", "Quiet Admiral", "Lantern Bay", "Northern Thimble", "Velvet Ridge", "Saltmarsh Echo", "Brass Kettle", "Moorland Whisper", "Captain Larkspur", "Silver Orchard", "Tidewater Jack", "Amber Weathervane", "Hollow Oak", "Kestrel Lane", "Midnight Hayrick", "Paper Compass", "Rosehip Rebel", "Sable Fenwick", "Thistledown Gale", "Winter Ledger", "Juniper Ford", "Marble Arch Lad", "Foxglove Hill", "Gilded Tern", "Shepherd's Lamp", "Pewter Moon", "Blackthorn Belle", "Ivy Causeway", "Oakum Star", "Larch Valley", "Bramble Prince", "Cobble Street", "Dovecote Duke", "Ember Wharf", "Fernhill Folly", "Granite Waltz", "Heather Bellows", "Inkwell Ivy", "Jasper Brook"];
const TRAINERS = ["A. Example", "B. Sample", "C. Demo", "D. Placeholder", "E. Specimen", "F. Mock", "G. Model", "H. Pattern", "J. Trial", "K. Prototype", "L. Draft", "M. Dummy"];
const JOCKEYS = ["P. Example", "R. Sample", "S. Demo", "T. Placeholder", "W. Specimen", "N. Mock", "O. Model", "Q. Pattern", "U. Trial", "V. Prototype", "Y. Draft", "Z. Dummy"];
const SEX = ["g", "m", "c", "f", "g", "g"];
const GOING = ["Good", "Good to Soft", "Soft", "Good to Firm", "Standard", "Heavy"];
const HEAD = [null, null, "p", "t", "b", null, "h", null];
const FORM = "1234567890PF-";

/** Deterministic pseudo-random from a seed — same example data every visit. */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const hash = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const horseId = (i: number) => `demo-h${i}`;
export const trainerId = (i: number) => `demo-t${i}`;
export const jockeyId = (i: number) => `demo-j${i}`;

function meetingsFor(date: string): MeetingRow[] {
  const r = rng(hash(date));
  const n = 2 + Math.floor(r() * 3);
  const pool = [...RACECOURSES];
  return Array.from({ length: n }, (_, mi) => {
    const course = pool.splice(Math.floor(r() * pool.length), 1)[0]!;
    const jumps = course.code === "Jumps" || (course.code !== "Flat" && r() < 0.5);
    const going = course.surface === "All-weather" ? "Standard" : GOING[Math.floor(r() * 4)]!;
    const races: RaceRow[] = Array.from({ length: 6 }, (_, ri) => {
      const off = new Date(`${date}T${String(12 + ri).padStart(2, "0")}:${mi % 2 ? "45" : "15"}:00Z`).toISOString();
      const field = 6 + Math.floor(r() * 7);
      const start = Math.floor(r() * HORSES.length);
      const runners: RunnerRow[] = Array.from({ length: field }, (_, k) => {
        const h = (start + k * 3) % HORSES.length;
        return { id: `demo-${date}-${mi}-${ri}-${k}`, cloth_number: k + 1, draw: jumps ? null : 1 + ((k * 5 + ri) % field), age: 3 + (h % 6), weight_lbs: 126 + ((h * 7 + ri) % 30), official_rating: 60 + ((h * 13 + ri) % 75),
          form: Array.from({ length: 5 }, (_, f) => FORM[(h + f * 4 + ri) % (jumps ? 13 : 10)]).join(""), headgear: HEAD[h % HEAD.length] ?? null, non_runner: r() < 0.05,
          horse: { id: horseId(h), name: HORSES[h]!, sex: SEX[h % SEX.length]! }, trainer: { id: trainerId(h % 12), name: TRAINERS[h % 12]! }, jockey: { id: jockeyId((h + ri) % 12), name: JOCKEYS[(h + ri) % 12]! } };
      });
      const yards = jumps ? 3520 + Math.floor(r() * 8) * 440 : 1100 + Math.floor(r() * 10) * 220;
      return { id: `demo-${date}-${mi}-${ri}`, off_time: off, name: `Example ${jumps ? (ri % 2 ? "Handicap Hurdle" : "Novices' Chase") : (ri % 2 ? "Handicap Stakes" : "Maiden Stakes")}`, race_type: jumps ? (ri % 2 ? "Hurdle" : "Chase") : "Flat", distance_yards: yards, class: String(1 + Math.floor(r() * 6)), prize_gbp: null, going, field_size: field, status: new Date(off).getTime() < Date.now() ? "finished" : "scheduled", runners };
    });
    return { id: `demo-${date}-${mi}`, meeting_date: date, going, surface: course.surface, status: "scheduled", course: { id: course.id, name: course.name }, races };
  });
}

export function demoMeetings(from: string, to: string): MeetingRow[] {
  const out: MeetingRow[] = [];
  for (let d = new Date(`${from}T12:00:00Z`); londonDate(d) <= to; d = new Date(d.getTime() + 86_400_000)) out.push(...meetingsFor(londonDate(d)));
  return out;
}

/** Example finishing order — placings only, never starting prices. */
function placings(race: RaceRow) {
  const r = rng(hash(race.id));
  return race.runners.filter((x) => !x.non_runner).map((x) => ({ x, k: r() })).sort((a, b) => a.k - b.k).map((o, i) => ({ runner: o.x, position: i + 1 }));
}

export function demoResults(now = new Date()): ResultRow[] {
  return demoMeetings(londonDate(now, -7), londonDate(now, -1)).flatMap((m) => m.races.flatMap((race) => placings(race).map(({ runner, position }) => ({
    race_id: race.id, position, status: "finished", starting_price_decimal: null, horse: runner.horse ? { id: runner.horse.id, name: runner.horse.name } : null,
    race: { name: race.name, off_time: race.off_time, meeting: { course: m.course ? { name: m.course.name } : null } },
  }))));
}

const past = (now: Date) => demoMeetings(londonDate(now, -60), londonDate(now, -1));

export function demoHorse(id: string, now = new Date()) {
  const i = Number(id.replace("demo-h", "")); if (!(i >= 0 && i < HORSES.length)) return null;
  const career: CareerRun[] = [];
  for (const m of past(now)) for (const race of m.races) for (const p of placings(race)) if (p.runner.horse?.id === id)
    career.push({ race_id: race.id, off_time: race.off_time, race: race.name, course: m.course?.name ?? null, distance_yards: race.distance_yards, going: race.going, position: p.position, status: "finished", sp: null, weight_lbs: p.runner.weight_lbs, rating: p.runner.official_rating });
  career.sort((a, b) => b.off_time.localeCompare(a.off_time));
  return { horse: { id, name: HORSES[i]!, foaled: null, sex: SEX[i % SEX.length]!, sire: "Example Sire", dam: "Example Dam", country: "GB", trainer: { id: trainerId(i % 12), name: TRAINERS[i % 12]! }, aliases: [] }, career };
}

export function demoHorseList(q: string) {
  return HORSES.map((name, i) => ({ id: horseId(i), name, sex: SEX[i % SEX.length]!, foaled: null, trainer: { name: TRAINERS[i % 12]! } })).filter((h) => h.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
}

export function demoPeople(q: string) {
  const f = (names: string[], mk: (i: number) => string) => names.map((name, i) => ({ id: mk(i), name })).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return { trainers: f(TRAINERS, trainerId), jockeys: f(JOCKEYS, jockeyId) };
}

export function demoPerson(kind: "trainer" | "jockey", id: string, now = new Date()) {
  const names = kind === "jockey" ? JOCKEYS : TRAINERS;
  const i = Number(id.replace(/demo-[tj]/, "")); if (!(i >= 0 && i < 12)) return null;
  const rows: { off_time: string; race: string; course: string; horse: string; horse_id: string; position: number | null }[] = [];
  for (const m of past(now)) for (const race of m.races) for (const p of placings(race)) if ((kind === "jockey" ? p.runner.jockey?.id : p.runner.trainer?.id) === id)
    rows.push({ off_time: race.off_time, race: race.name, course: m.course?.name ?? "", horse: p.runner.horse?.name ?? "", horse_id: p.runner.horse?.id ?? "", position: p.position });
  rows.sort((a, b) => b.off_time.localeCompare(a.off_time));
  return { person: { id, name: names[i]! }, rows };
}
