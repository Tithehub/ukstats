/** Pure AI-predictor scorer. Ranks runners only from racecard facts (form + official rating). An opinion, never a statistic. */
import type { RaceRow, RunnerRow } from "./racing.functions";
import { lastForm, weightLabel } from "./racing";

export type Confidence = "Low" | "Medium" | "High";
export interface Ranked { runner: RunnerRow; score: number; rank: number; why: string[] }
export type Prediction =
  | { ok: true; ranked: Ranked[]; nonRunners: RunnerRow[]; confidence: Confidence }
  | { ok: false; reason: string; nonRunners: RunnerRow[] };

const POS: Record<string, number> = { "1": 10, "2": 7, "3": 5, "4": 3 };

/** 0–10 from the last five form figures, most recent weighted highest. Null when no form. */
export function formScore(form: string | null | undefined): number | null {
  const f = lastForm(form, 5);
  if (!f.length) return null;
  let sum = 0, w = 0;
  f.forEach((c, i) => { const wt = i + 1; sum += (POS[c] ?? (/[5-9]/.test(c) ? 1 : 0)) * wt; w += wt; });
  return sum / w;
}

export function predictRace(race: RaceRow): Prediction {
  const active = race.runners.filter((r) => !r.non_runner);
  const nonRunners = race.runners.filter((r) => r.non_runner);
  if (active.length < 2) return { ok: false, reason: "Fewer than two declared runners.", nonRunners };
  const known = active.filter((r) => r.official_rating != null || formScore(r.form) != null);
  if (known.length * 2 < active.length) return { ok: false, reason: "Not enough racecard information to predict.", nonRunners };

  const ors = active.map((r) => r.official_rating).filter((x): x is number => x != null);
  const lo = Math.min(...ors), hi = Math.max(...ors);
  const wts = active.map((r) => r.weight_lbs).filter((x): x is number => x != null);
  const topWt = wts.length ? Math.max(...wts) : null;

  const scored = active.map((r) => {
    const fs = formScore(r.form);
    const rs = r.official_rating == null || !ors.length ? null : hi === lo ? 5 : ((r.official_rating - lo) / (hi - lo)) * 10;
    const parts = [fs, rs].filter((x): x is number => x != null);
    const score = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10 : 0;
    const why: string[] = [];
    const lf = lastForm(r.form).join("");
    if (lf) why.push(`Form ${lf}`);
    if (r.official_rating != null) why.push(r.official_rating === hi && ors.length > 1 ? `Top rated (OR ${r.official_rating})` : `OR ${r.official_rating}`);
    if (r.weight_lbs != null) why.push(topWt === r.weight_lbs ? `Top weight ${weightLabel(r.weight_lbs)}` : `Carries ${weightLabel(r.weight_lbs)}`);
    if (r.draw != null) why.push(`Draw ${r.draw}`);
    if (r.headgear) why.push(`Headgear: ${r.headgear}`);
    return { runner: r, score, rank: 0, why };
  }).sort((a, b) => b.score - a.score || (a.runner.cloth_number ?? 99) - (b.runner.cloth_number ?? 99));

  scored.forEach((s, i) => { s.rank = i > 0 && s.score === scored[i - 1].score ? scored[i - 1].rank : i + 1; });
  const gap = scored[0].score - scored[1].score;
  const confidence: Confidence = gap >= 1.5 ? "High" : gap >= 0.5 ? "Medium" : "Low";
  return { ok: true, ranked: scored, nonRunners, confidence };
}
