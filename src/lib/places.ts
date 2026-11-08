// Pure, browser-safe helpers for the Happiest places page and the unofficial
// "Thinking of moving?" comparison. Parsers read official files only; the
// comparison score is UKStats' own weighting and is always labelled unofficial.

export type Nation = "England" | "Wales" | "Scotland" | "Northern Ireland";
export const NATIONS: Nation[] = ["England", "Scotland", "Wales", "Northern Ireland"];

/** Local authority code prefixes (unitary, district, metropolitan, London borough, Wales, Scotland, NI). */
const LA_PREFIXES = ["E06", "E07", "E08", "E09", "W06", "S12", "N09"];
export const isLaCode = (c: string) => LA_PREFIXES.includes(c.slice(0, 3));
export function nationOf(code: string): Nation {
  const p = code[0];
  return p === "W" ? "Wales" : p === "S" ? "Scotland" : p === "N" ? "Northern Ireland" : "England";
}

export type WellbeingKey = "lifeSatisfaction" | "happiness" | "worthwhile" | "anxiety";
export const WELLBEING_MEASURES: { key: WellbeingKey; ons: string; label: string; lowerIsBetter: boolean }[] = [
  { key: "lifeSatisfaction", ons: "life-satisfaction", label: "Life satisfaction", lowerIsBetter: false },
  { key: "happiness", ons: "happiness", label: "Happiness", lowerIsBetter: false },
  { key: "worthwhile", ons: "worthwhile", label: "Feeling life is worthwhile", lowerIsBetter: false },
  { key: "anxiety", ons: "anxiety", label: "Anxiety", lowerIsBetter: true },
];
export type Wellbeing = Record<WellbeingKey, number | null>;

/** Minimal RFC-4180 CSV line splitter (handles quoted commas). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export interface WellbeingTable { period: string; rows: Map<string, { name: string; wb: Wellbeing }> }

/**
 * Reads the ONS "Personal well-being estimates by local authority" CSV. Keeps the
 * latest period, average (mean) estimates, local authorities only. A blank value
 * (ONS marks these [u] unreliable or [x] not available) stays null — never filled.
 */
export function parseWellbeingCsv(text: string): WellbeingTable {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = splitCsvLine(lines[0] ?? "");
  const iv = 0, it = head.indexOf("Time"), ic = head.indexOf("administrative-geography"), ig = head.indexOf("Geography"),
    im = head.indexOf("measure-of-wellbeing"), ie = head.indexOf("wellbeing-estimate");
  const recs = lines.slice(1).map(splitCsvLine);
  const period = recs.reduce((m, r) => ((r[it] ?? "") > m ? r[it]! : m), "");
  const rows = new Map<string, { name: string; wb: Wellbeing }>();
  for (const r of recs) {
    if (r[it] !== period || r[ie] !== "average-mean" || !isLaCode(r[ic] ?? "")) continue;
    const m = WELLBEING_MEASURES.find((x) => x.ons === r[im]);
    if (!m) continue;
    const code = r[ic]!;
    const e = rows.get(code) ?? { name: (r[ig] ?? code).trim(), wb: { lifeSatisfaction: null, happiness: null, worthwhile: null, anxiety: null } };
    const v = (r[iv] ?? "").trim();
    e.wb[m.key] = v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
    rows.set(code, e);
  }
  return { period, rows };
}

/** Ranks places by one measure; places without a published value are never ranked. */
export function rankByMeasure<T extends { wellbeing: Wellbeing | null }>(places: T[], key: WellbeingKey, best: boolean): T[] {
  const lower = WELLBEING_MEASURES.find((m) => m.key === key)!.lowerIsBetter;
  const has = places.filter((p) => p.wellbeing?.[key] != null);
  const dir = (lower ? 1 : -1) * (best ? 1 : -1);
  return has.sort((a, b) => dir * (a.wellbeing![key]! - b.wellbeing![key]!));
}

// ---------------- Places payload ----------------

export interface SourceRef { name: string; url: string; period: string | null }
export interface Place {
  code: string;
  name: string;
  nation: Nation;
  wellbeing: Wellbeing | null;
  crimeRate: number | null;     // recorded crime per 1,000 (England & Wales)
  housePrice: number | null;    // UK HPI average price
  weeklyPay: number | null;     // ASHE median gross weekly pay, full-time, residents
  over65Share: number | null;   // % of residents aged 65+
  goodSchoolsShare: number | null; // % of graded schools Good/Outstanding for quality of education (England)
  schoolsArea?: string | null;     // council the school figure belongs to (the county, for districts)
}
export interface PlacesPayload {
  fetchedAt: string;
  places: Place[];
  sources: Record<"wellbeing" | "crime" | "housePrice" | "pay" | "population" | "schools", SourceRef>;
  errors: string[];
}

// ---------------- Unofficial comparison ----------------

export type FactorKey = "safety" | "cost" | "happiness" | "schools" | "retirement" | "pay";
export const FACTORS: { key: FactorKey; label: string; help: string }[] = [
  { key: "safety", label: "Safety", help: "Recorded crime per 1,000 people (lower is better)" },
  { key: "cost", label: "Housing cost", help: "Average house price ÷ median yearly pay (lower is better)" },
  { key: "happiness", label: "Happiness", help: "ONS life satisfaction, happiness, worthwhile and anxiety" },
  { key: "schools", label: "Schools", help: "Share of schools rated Good or Outstanding for quality of education (England)" },
  { key: "retirement", label: "Retirement", help: "Share of residents aged 65 and over" },
  { key: "pay", label: "Jobs & pay", help: "Median full-time weekly pay of residents (higher is better)" },
];

export type Household = "single" | "couple" | "family" | "retired";
export const HOUSEHOLDS: { key: Household; label: string }[] = [
  { key: "single", label: "Single person" },
  { key: "couple", label: "Couple" },
  { key: "family", label: "Family with children" },
  { key: "retired", label: "Retired" },
];
/** Starting weights (percent, each preset sums to 100). Users can change them with the sliders. */
export const PRESET_WEIGHTS: Record<Household, Record<FactorKey, number>> = {
  single: { safety: 20, cost: 25, happiness: 20, schools: 0, retirement: 0, pay: 35 },
  couple: { safety: 25, cost: 25, happiness: 20, schools: 5, retirement: 5, pay: 20 },
  family: { safety: 25, cost: 20, happiness: 15, schools: 30, retirement: 0, pay: 10 },
  retired: { safety: 30, cost: 15, happiness: 25, schools: 0, retirement: 30, pay: 0 },
};

export const UNOFFICIAL_LABEL = "Unofficial — UKStats' own weighting of official figures, for testing purposes only. Not an official statistic and not advice.";

/** Raw official input for each factor (null when not published for that place). */
export function factorRaw(p: Place, f: FactorKey): number | null {
  switch (f) {
    case "safety": return p.crimeRate;
    case "cost": return p.housePrice != null && p.weeklyPay ? p.housePrice / (p.weeklyPay * 52) : null;
    case "schools": return p.goodSchoolsShare;
    case "retirement": return p.over65Share;
    case "pay": return p.weeklyPay;
    case "happiness": return null; // composite of percentiles, see factorPositions
  }
}
const LOWER_BETTER: Record<FactorKey, boolean> = { safety: true, cost: true, happiness: false, schools: false, retirement: false, pay: false };

/** Percentile position 0–100 (100 = best) of v among values. */
export function percentile(values: number[], v: number, lowerIsBetter: boolean): number {
  if (values.length < 2) return 50;
  let below = 0, equal = 0;
  for (const x of values) { if (x < v) below++; else if (x === v) equal++; }
  const p = (below + (equal - 1) / 2) / (values.length - 1);
  return Math.round((lowerIsBetter ? 1 - p : p) * 100);
}

/** Every place's 0–100 position on every factor (null when a needed figure is missing). */
export function factorPositions(places: Place[]): Map<string, Record<FactorKey, number | null>> {
  const out = new Map<string, Record<FactorKey, number | null>>();
  const cols: Partial<Record<FactorKey, number[]>> = {};
  for (const f of FACTORS) if (f.key !== "happiness") cols[f.key] = places.map((p) => factorRaw(p, f.key)).filter((x): x is number => x != null);
  const wbCols = Object.fromEntries(WELLBEING_MEASURES.map((m) => [m.key, places.map((p) => p.wellbeing?.[m.key]).filter((x): x is number => x != null)])) as Record<WellbeingKey, number[]>;
  for (const p of places) {
    const r = {} as Record<FactorKey, number | null>;
    for (const f of FACTORS) {
      if (f.key === "happiness") {
        const parts = WELLBEING_MEASURES.map((m) => { const v = p.wellbeing?.[m.key]; return v == null ? null : percentile(wbCols[m.key], v, m.lowerIsBetter); });
        r.happiness = parts.every((x) => x != null) ? Math.round((parts as number[]).reduce((a, b) => a + b, 0) / parts.length) : null;
      } else {
        const v = factorRaw(p, f.key);
        r[f.key] = v == null ? null : percentile(cols[f.key]!, v, LOWER_BETTER[f.key]);
      }
    }
    out.set(p.code, r);
  }
  return out;
}

export interface Comparison {
  label: string;
  used: FactorKey[];
  dropped: FactorKey[];
  from: { score: number | null; positions: Record<FactorKey, number | null> };
  to: { score: number | null; positions: Record<FactorKey, number | null> };
  verdicts: Record<FactorKey, "better" | "worse" | "similar" | "no comparable figure">;
}

/** A factor missing for either place is dropped for both, so the two scores always use the same inputs. */
export function compare(fromPos: Record<FactorKey, number | null>, toPos: Record<FactorKey, number | null>, weights: Record<FactorKey, number>): Comparison {
  const used: FactorKey[] = [], dropped: FactorKey[] = [];
  const verdicts = {} as Comparison["verdicts"];
  for (const f of FACTORS) {
    const a = fromPos[f.key], b = toPos[f.key];
    if (a == null || b == null) { verdicts[f.key] = "no comparable figure"; if ((weights[f.key] ?? 0) > 0) dropped.push(f.key); continue; }
    verdicts[f.key] = b - a >= 10 ? "better" : a - b >= 10 ? "worse" : "similar";
    if ((weights[f.key] ?? 0) > 0) used.push(f.key);
  }
  const total = used.reduce((s, k) => s + weights[k], 0);
  const score = (pos: Record<FactorKey, number | null>) => total > 0 ? Math.round(used.reduce((s, k) => s + weights[k] * pos[k]!, 0) / total) : null;
  return { label: UNOFFICIAL_LABEL, used, dropped, from: { score: score(fromPos), positions: fromPos }, to: { score: score(toPos), positions: toPos }, verdicts };
}

/** Normalises names so the DfE school register's council names match ONS names. */
export const normName = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");
