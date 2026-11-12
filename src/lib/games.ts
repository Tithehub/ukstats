// Pure game engine. Every question is built from World Bank figures exactly as published
// (the cached WDI payload) — nothing is invented. Same seed => same questions, so the
// server can re-score a daily entry without trusting the browser.
import { MAX_LAG_YEARS, fmtWorld, type WorldIndicator, type WorldPayload, WORLD_INDICATORS } from "./world";

export const GAME_INDICATOR_SLUGS = ["population", "gdp", "gdp-per-person", "life-expectancy", "urban", "co2-per-person"] as const;
const MIN_POPULATION = 1_000_000; // keep to countries most players have heard of

export interface Fact { iso3: string; iso2: string; name: string; value: number; year: number }
export type Question =
  | { kind: "hl"; ind: WorldIndicator; a: Fact; b: Fact }
  | { kind: "guess"; ind: WorldIndicator; a: Fact }
  | { kind: "rank"; ind: WorldIndicator; items: Fact[] };
export type Answer = number | string[] | null;

export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)] as T;
function sample<T>(r: () => number, arr: T[], n: number): T[] {
  const a = [...arr]; const out: T[] = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0] as T);
  return out;
}

/** Facts for one indicator: recent-enough figures for countries of 1m+ people. */
export function factsFor(p: WorldPayload, ind: WorldIndicator): Fact[] {
  const vals = p.values[ind.id] ?? {}; const pop = p.values["SP.POP.TOTL"] ?? {};
  const rows = p.countries.flatMap((c) => { const v = vals[c.iso3]; return v && (pop[c.iso3]?.value ?? 0) >= MIN_POPULATION ? [{ iso3: c.iso3, iso2: c.iso2, name: c.name, value: v.value, year: v.year }] : []; });
  if (!rows.length) return [];
  const newest = Math.max(...rows.map((r) => r.year));
  return rows.filter((r) => newest - r.year <= MAX_LAG_YEARS);
}

function indicators(p: WorldPayload) {
  return WORLD_INDICATORS.filter((i) => (GAME_INDICATOR_SLUGS as readonly string[]).includes(i.slug)).map((ind) => ({ ind, facts: factsFor(p, ind) })).filter((x) => x.facts.length >= 10);
}

export function makeQuestion(p: WorldPayload, kind: Question["kind"], r: () => number): Question | null {
  const pool = indicators(p).filter((x) => kind !== "guess" || x.ind.slug === "population" || x.ind.slug === "life-expectancy");
  if (!pool.length) return null;
  const { ind, facts } = pick(r, pool);
  if (kind === "guess") return { kind, ind, a: pick(r, facts) };
  if (kind === "hl") {
    for (let t = 0; t < 20; t++) { const [a, b] = sample(r, facts, 2); if (a && b && a.value !== b.value) return { kind, ind, a, b }; }
    return null;
  }
  const items = sample(r, facts, 5);
  return new Set(items.map((i) => i.value)).size === 5 ? { kind, ind, items } : null;
}

export function makeRound(p: WorldPayload, kinds: Question["kind"][], seed: string): Question[] {
  const r = rng(seed); const out: Question[] = [];
  for (const k of kinds) { for (let t = 0; t < 10; t++) { const q = makeQuestion(p, k, r); if (q) { out.push(q); break; } } }
  return out;
}

export const DAILY_KINDS: Question["kind"][] = ["hl", "guess", "rank", "hl", "guess"];
export const dailyRound = (p: WorldPayload, day: string) => makeRound(p, DAILY_KINDS, `daily-${day}`);

/** Points for a numeric guess by percentage error. */
export function guessPoints(guess: number, actual: number): number {
  if (!Number.isFinite(guess) || guess < 0 || actual === 0) return 0;
  const err = Math.abs(guess - actual) / Math.abs(actual);
  if (err === 0) return 100; if (err <= 0.01) return 90; if (err <= 0.05) return 75; if (err <= 0.1) return 50; if (err <= 0.25) return 25;
  return 0;
}
export const rankOrder = (items: Fact[]) => [...items].sort((x, y) => y.value - x.value).map((i) => i.iso3);

export function scoreQuestion(q: Question, ans: Answer): number {
  if (ans == null) return 0;
  if (q.kind === "hl") return typeof ans === "number" && (ans === 0 ? q.a.value > q.b.value : ans === 1 ? q.b.value > q.a.value : false) ? 100 : 0;
  if (q.kind === "guess") return typeof ans === "number" ? guessPoints(ans, q.a.value) : 0;
  if (!Array.isArray(ans)) return 0;
  const right = rankOrder(q.items);
  return right.reduce((s, iso, i) => s + (ans[i] === iso ? 20 : 0), 0);
}
export const scoreRound = (qs: Question[], answers: Answer[]) => qs.reduce((s, q, i) => s + scoreQuestion(q, answers[i] ?? null), 0);

export function questionText(q: Question): string {
  const l = q.ind.label.replace(/ \(.*\)$/, "").toLowerCase();
  if (q.kind === "hl") return `Which has the higher ${l}?`;
  if (q.kind === "guess") return `What is ${q.a.name}'s ${l}?`;
  return `Rank these from highest to lowest ${l}`;
}
export const fmtFact = (f: Fact, ind: WorldIndicator) => fmtWorld(f.value, ind.unit);

/** Emoji result line for sharing, e.g. 🟩🟨⬛ */
export const shareBlocks = (points: number[]) => points.map((p) => (p >= 90 ? "🟩" : p >= 25 ? "🟨" : "⬛")).join("");
