// Pure game engine. Every question is built from World Bank figures exactly as published
// (the cached WDI payload) — nothing is invented. Same seed => same questions, so the
// server can re-score a daily entry without trusting the browser.
import { MAX_LAG_YEARS, fmtWorld, type WorldIndicator, type WorldPayload, WORLD_INDICATORS } from "./world";
import type { PlacesPayload, SourceRef } from "./places";
import { ENGLISH_HISTORY, WORLD_KNOWLEDGE } from "./quiz.data";

/** What a question measures. World questions use World Bank indicators; Britain questions use council figures. */
export interface Measure { id: string; slug: string; label: string; unit: WorldIndicator["unit"] | "gbp" | "score" }

export const GAME_INDICATOR_SLUGS = ["population", "gdp", "gdp-per-person", "life-expectancy", "urban", "co2-per-person"] as const;
const MIN_POPULATION = 1_000_000; // keep to countries most players have heard of

export interface Fact { iso3: string; iso2: string; name: string; value: number; year: number }
export type Question =
  | { kind: "hl"; ind: Measure; a: Fact; b: Fact; src?: SourceRef }
  | { kind: "guess"; ind: Measure; a: Fact; choices: Fact[]; src?: SourceRef }
  | { kind: "rank"; ind: Measure; items: Fact[]; dir: "high" | "low"; src?: SourceRef }
  | { kind: "flag"; ind: Measure; a: Fact; choices: Fact[]; src?: SourceRef }
  | { kind: "quiz"; ind: Measure; q: string; options: string[]; answer: number; explain: string; src: SourceRef };
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

type Pool = { ind: Measure; facts: Fact[]; src?: SourceRef; guessable: boolean };
function indicators(p: WorldPayload): Pool[] {
  return WORLD_INDICATORS.filter((i) => (GAME_INDICATOR_SLUGS as readonly string[]).includes(i.slug)).map((ind) => ({ ind, facts: factsFor(p, ind), guessable: ind.slug === "population" || ind.slug === "life-expectancy" })).filter((x) => x.facts.length >= 10);
}

export const DAILY_KINDS: Question["kind"][] = ["hl", "guess", "rank", "hl", "guess"];

// ---- Britain by the Numbers: council figures from the places payload (ONS, UK HPI, ASHE) ----
const UK_MEASURES: { key: "housePrice" | "weeklyPay" | "crimeRate" | "over65Share" | "lifeSatisfaction"; src: "housePrice" | "pay" | "crime" | "population" | "wellbeing"; m: Measure; guessable: boolean }[] = [
  { key: "housePrice", src: "housePrice", m: { id: "uk-house-price", slug: "house-price", label: "Average house price", unit: "gbp" }, guessable: true },
  { key: "weeklyPay", src: "pay", m: { id: "uk-weekly-pay", slug: "weekly-pay", label: "Median full-time weekly pay", unit: "gbp" }, guessable: true },
  { key: "crimeRate", src: "crime", m: { id: "uk-crime-rate", slug: "crime-rate", label: "Recorded crime (per 1,000 people)", unit: "rate" }, guessable: false },
  { key: "over65Share", src: "population", m: { id: "uk-over-65", slug: "over-65", label: "Share of residents aged 65+", unit: "pct" }, guessable: false },
  { key: "lifeSatisfaction", src: "wellbeing", m: { id: "uk-life-satisfaction", slug: "life-satisfaction", label: "Life satisfaction (out of 10)", unit: "score" }, guessable: false },
];
export function ukPools(p: PlacesPayload): Pool[] {
  return UK_MEASURES.map(({ key, src, m, guessable }) => ({
    ind: m, src: p.sources[src], guessable,
    facts: p.places.flatMap((pl) => { const v = key === "lifeSatisfaction" ? pl.wellbeing?.lifeSatisfaction : pl[key]; return typeof v === "number" && Number.isFinite(v) ? [{ iso3: pl.code, iso2: "", name: pl.name, value: v, year: 0 }] : []; }),
  })).filter((x) => x.facts.length >= 10);
}

export function questionFrom(pools: Pool[], kind: Question["kind"], r: () => number): Question | null {
  const pool = pools.filter((x) => kind !== "guess" || x.guessable);
  if (!pool.length) return null;
  const { ind, facts, src } = pick(r, pool);
  const extra = src ? { src } : {};
  if (kind === "guess") {
    // Wrong options are other places' real published figures for the same measure — never invented.
    const a = pick(r, facts); const seen = new Set([a.value]); const others: Fact[] = [];
    for (const f of sample(r, facts.filter((f) => f.iso3 !== a.iso3), facts.length)) { if (fmtFact(f, ind) !== fmtFact(a, ind) && !seen.has(f.value)) { seen.add(f.value); others.push(f); } if (others.length === 3) break; }
    return others.length === 3 ? { kind, ind, a, choices: sample(r, [a, ...others], 4), ...extra } : null;
  }
  if (kind === "hl") {
    for (let t = 0; t < 20; t++) { const [a, b] = sample(r, facts, 2); if (a && b && a.value !== b.value) return { kind, ind, a, b, ...extra }; }
    return null;
  }
  if (kind === "flag" || kind === "quiz") return null;
  const items = sample(r, facts, 4); const dir = r() < 0.5 ? "high" : "low";
  return new Set(items.map((i) => i.value)).size === 4 ? { kind, ind, items, dir, ...extra } : null;
}
export const makeQuestion = (p: WorldPayload, kind: Question["kind"], r: () => number) => questionFrom(indicators(p), kind, r);

export function roundFrom(pools: Pool[], kinds: Question["kind"][], seed: string): Question[] {
  const r = rng(seed); const out: Question[] = [];
  for (const k of kinds) { for (let t = 0; t < 10; t++) { const q = questionFrom(pools, k, r); if (q) { out.push(q); break; } } }
  return out;
}
export const makeRound = (p: WorldPayload, kinds: Question["kind"][], seed: string) => roundFrom(indicators(p), kinds, seed);
export const BRITAIN_KINDS: Question["kind"][] = ["hl", "hl", "guess", "hl", "rank", "hl", "guess", "hl", "rank", "hl"];
export const britainRound = (p: PlacesPayload, seed: string) => roundFrom(ukPools(p), BRITAIN_KINDS, `britain-by-the-numbers-${seed}`);

/** Every scored game and the question kinds of one round. */
export const GAME_DEFS = {
  "daily-5": { title: "The Daily 5", kinds: DAILY_KINDS },
  "higher-or-lower": { title: "Higher or Lower", kinds: Array<Question["kind"]>(10).fill("hl") },
  "guess-the-number": { title: "Guess the Number", kinds: Array<Question["kind"]>(10).fill("guess") },
  "rank-the-world": { title: "Rank the World", kinds: Array<Question["kind"]>(10).fill("rank") },
  "britain-by-the-numbers": { title: "Britain by the Numbers", kinds: BRITAIN_KINDS },
  "guess-the-flag": { title: "Guess the Flag", kinds: Array<Question["kind"]>(10).fill("flag") },
  "english-history": { title: "English History", kinds: Array<Question["kind"]>(10).fill("quiz") },
  "world-knowledge": { title: "World Knowledge & History", kinds: Array<Question["kind"]>(10).fill("quiz") },
} as const;
export type GameId = keyof typeof GAME_DEFS;
export const isGameId = (g: string): g is GameId => g in GAME_DEFS;

// ---- Guess the Flag: countries in the World Bank register (1m+ people), shown by their national flag ----
const FLAG_MEASURE: Measure = { id: "SP.POP.TOTL", slug: "population", label: "Guess the flag", unit: "people" };
export function flagRound(p: WorldPayload, seed: string): Question[] {
  const pop = WORLD_INDICATORS.find((i) => i.slug === "population");
  const facts = pop ? factsFor(p, pop).filter((f) => /^[A-Z]{2}$/.test(f.iso2)) : [];
  if (facts.length < 10) return [];
  const r = rng(`guess-the-flag-${seed}`);
  return sample(r, facts, 10).map((a) => {
    const choices = [a, ...sample(r, facts.filter((f) => f.iso3 !== a.iso3), 3)];
    return { kind: "flag" as const, ind: FLAG_MEASURE, a, choices: sample(r, choices, 4) };
  });
}

// ---- Knowledge quizzes: a fixed, referenced question bank (quiz.data.ts), seeded shuffle ----
export type QuizGame = "english-history" | "world-knowledge";
export function quizRound(game: QuizGame, seed: string): Question[] {
  const bank = game === "english-history" ? ENGLISH_HISTORY : WORLD_KNOWLEDGE;
  const r = rng(`${game}-${seed}`);
  const ind: Measure = { id: game, slug: game, label: GAME_DEFS[game].title, unit: "score" };
  return sample(r, bank, 10).map(([q, right, ...rest]) => {
    const [w1, w2, w3, explain, ref] = rest;
    const options = sample(r, [right, w1, w2, w3], 4);
    return { kind: "quiz" as const, ind, q, options, answer: options.indexOf(right), explain, src: { name: "Encyclopaedia Britannica", url: `https://www.britannica.com/search?query=${encodeURIComponent(ref)}`, period: null } as SourceRef };
  });
}

export const dailyRound = (p: WorldPayload, day: string) => makeRound(p, DAILY_KINDS, `daily-${day}`);

/** Points for a numeric guess by percentage error. */
export function guessPoints(guess: number, actual: number): number {
  if (!Number.isFinite(guess) || guess < 0 || actual === 0) return 0;
  const err = Math.abs(guess - actual) / Math.abs(actual);
  if (err === 0) return 100; if (err <= 0.01) return 90; if (err <= 0.05) return 75; if (err <= 0.1) return 50; if (err <= 0.25) return 25;
  return 0;
}
export const rankOrder = (items: Fact[]) => [...items].sort((x, y) => y.value - x.value).map((i) => i.iso3);
/** The correct pick in a "which is highest/lowest" question. */
export const rankAnswer = (q: Extract<Question, { kind: "rank" }>) => { const o = rankOrder(q.items); return q.dir === "high" ? o[0] : o[o.length - 1]; };

export function scoreQuestion(q: Question, ans: Answer): number {
  if (ans == null) return 0;
  if (q.kind === "hl") return typeof ans === "number" && (ans === 0 ? q.a.value > q.b.value : ans === 1 ? q.b.value > q.a.value : false) ? 100 : 0;
  if (q.kind === "guess") return typeof ans === "number" && q.choices[ans]?.iso3 === q.a.iso3 ? 100 : 0;
  if (q.kind === "quiz") return ans === q.answer ? 100 : 0;
  if (q.kind === "flag") return typeof ans === "number" && q.choices[ans]?.iso3 === q.a.iso3 ? 100 : 0;
  return typeof ans === "number" && q.items[ans]?.iso3 === rankAnswer(q) ? 100 : 0;
}
export const scoreRound = (qs: Question[], answers: Answer[]) => qs.reduce((s, q, i) => s + scoreQuestion(q, answers[i] ?? null), 0);

export function questionText(q: Question): string {
  const l = q.ind.label.replace(/ \(.*\)$/, "").toLowerCase();
  if (q.kind === "hl") return `Which has the higher ${l}?`;
  if (q.kind === "flag") return "Which country's flag is this?";
  if (q.kind === "quiz") return q.q;
  if (q.kind === "guess") return `What is ${q.a.name}'s ${l}?`;
  return `Which has the ${q.dir === "high" ? "highest" : "lowest"} ${l}?`;
}
export function fmtFact(f: Fact, ind: Measure): string {
  if (ind.unit === "gbp") return `£${Math.round(f.value).toLocaleString("en-GB")}`;
  if (ind.unit === "score") return f.value.toFixed(2);
  return fmtWorld(f.value, ind.unit);
}

/** Emoji result line for sharing, e.g. 🟩🟨⬛ */
export const shareBlocks = (points: number[]) => points.map((p) => (p >= 90 ? "🟩" : p >= 25 ? "🟨" : "⬛")).join("");
