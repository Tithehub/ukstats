// Browser-safe shared types + helpers for the UK statistics register.

export type MetricStatus = "ok" | "unavailable" | "no-feed";

export type Category =
  | "Finance"
  | "Cost of living"
  | "Crime"
  | "Immigration"
  | "Housing"
  | "Weather"
  | "Defence & security"
  | "National alerts"
  | "Irregular immigration & cost";

/** Colour vocabulary used by the issuing bodies' own published scales. */
export type AlertTone = "neutral" | "green" | "yellow" | "amber" | "red" | "crimson";

export type ScaleKind = "terror" | "metoffice" | "flood" | "ukhsa" | "daqi";

/** The official published scale a status metric sits on, reproduced step for step. */
export interface MetricScale {
  kind: ScaleKind;
  /** Who sets the scale and how many steps it has, e.g. "JTAC / MI5 · 5 levels". */
  authority: string;
  steps: { label: string; tone: AlertTone }[];
  /** Index of the current step, or null when the level cannot be read. */
  current: number | null;
}


export interface Metric {
  id: string;
  category: Category;
  title: string;
  source: string;
  sourceUrl: string;
  /** Formatted headline value exactly as published. Null when no machine-readable feed exists. */
  value: string | null;
  /** Secondary line, e.g. reference period or breakdown. */
  sub: string | null;
  /** Period the figure covers, as published. */
  period: string | null;
  /** ISO date the source published this figure. */
  asOf: string | null;
  /** ISO date/time of the next scheduled release, when the publisher has announced one. */
  nextDue: string | null;
  /** Human description of the publication cadence. */
  cadence: string;
  change: { label: string; dir: "up" | "down" | "flat" } | null;
  spark: number[];
  status: MetricStatus;
  note: string | null;
  /** Set when the figure is arithmetic on a published total rather than published directly. */
  derivedFrom?: string | null;
  /** Period the money actually relates to, as published. */
  covers?: string | null;
  /** ISO date from which no published figure exists yet. */
  unknownFrom?: string | null;
}

export interface StatsPayload {
  metrics: Metric[];
  fetchedAt: string;
}

export const CATEGORIES: Category[] = [
  "Finance",
  "Cost of living",
  "Crime",
  "Immigration",
  "Housing",
  "Weather",
  "Defence & security",
  "Irregular immigration & cost",
];

export type Freshness = "fresh" | "ageing" | "overdue" | "unknown";

const DAY = 86_400_000;

export function freshnessOf(m: Metric, now = Date.now()): Freshness {
  if (m.status !== "ok" || !m.asOf) return "unknown";
  if (m.nextDue && new Date(m.nextDue).getTime() < now) return "overdue";
  const basis = m.unknownFrom ?? m.asOf;
  const age = now - new Date(basis).getTime();
  if (age < 7 * DAY) return "fresh";
  if (age < 28 * DAY) return "ageing";
  return "overdue";
}

export function ageLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "unknown";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "under 1h old";
  if (hours < 48) return `${hours}h old`;
  const days = Math.floor(diff / DAY);
  if (days < 60) return `${days}d old`;
  return `${Math.floor(days / 30)} months old`;
}

export function dueLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "no date announced";
  const diff = new Date(iso).getTime() - now;
  const days = Math.round(diff / DAY);
  if (diff < 0) return `overdue by ${Math.abs(days)}d`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days}d`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
