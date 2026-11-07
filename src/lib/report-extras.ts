// Pure helpers for the warnings, supply-kit and headline sections of the PDF reports.
// Warnings and headlines are copied verbatim; nothing here creates a figure.
import type { Metric } from "@/lib/uk-stats";
import type { ReportItem } from "@/lib/news-reports";
import { FCDO_ALERT_LABEL, US_LEVEL_LABEL, type FcdoAlert, type FcdoAlertEntry, type OfficialWarning } from "@/lib/unrest";

const WARNING_KINDS = new Set(["terror", "metoffice", "flood", "ukhsa"]);
/** UK government warning metrics (threat level, Met Office, flood, UKHSA) in register order. */
export const ukWarningMetrics = (metrics: Metric[]) => metrics.filter((m) => m.scale && WARNING_KINDS.has(m.scale.kind));

const FCDO_RANK: Record<FcdoAlert, number> = { all: 4, "all-but-essential": 3, "parts-all": 2.5, "parts-essential": 2, none: 1 };

export interface TravelRow {
  country: string; key: string;
  uk: string; ukUrl: string | null; us: string; usUrl: string | null;
  unrest: boolean; severity: number;
}

/** One row per country with each government's own wording side by side; most serious first, then A–Z. */
export function travelRows(warnings: OfficialWarning[], fcdo: Record<string, FcdoAlertEntry> | undefined, now: Date, days = 30): TravelRow[] {
  const by = new Map<string, OfficialWarning[]>();
  for (const w of warnings) by.set(w.key, [...(by.get(w.key) ?? []), w]);
  const cutoff = now.getTime() - days * 864e5;
  const rows: TravelRow[] = [];
  for (const [key, ws] of by) {
    const us = ws.find((w) => w.source === "US State Dept" && w.level);
    const f = fcdo?.[key];
    const country = (ws.find((w) => w.source === "FCDO") ?? ws[0]!).country;
    const unrest = ws.some((w) => w.mentionsUnrest && w.updated && Date.parse(w.updated) >= cutoff);
    rows.push({
      country, key,
      uk: f ? FCDO_ALERT_LABEL[f.status] : "Not checked", ukUrl: f?.url ?? ws.find((w) => w.source === "FCDO")?.url ?? null,
      us: us ? US_LEVEL_LABEL[us.level!] ?? `Level ${us.level}` : "Not checked", usUrl: us?.url ?? null,
      unrest, severity: Math.max(f ? FCDO_RANK[f.status] : 0, us?.level ?? 0),
    });
  }
  return rows.sort((a, b) => b.severity - a.severity || a.country.localeCompare(b.country));
}

const byNew = (a: ReportItem, b: ReportItem) => Date.parse(b.published) - Date.parse(a.published);
const UK_RE = /\b(UK|U\.K\.|Britain|British|England|English|Scotland|Scottish|Wales|Welsh|Northern Ireland|London)\b/i;

/** Latest UK headlines, verbatim, newest first. Police notices from UK forces always count. */
export function ukHeadlines(items: ReportItem[], max = 5): ReportItem[] {
  return items.filter((i) => i.official || UK_RE.test(i.title)).sort(byNew).slice(0, max);
}

/** Up to `max` headlines naming each country; countries with none are omitted. */
export function headlinesByCountry(items: ReportItem[], countries: string[], max = 3): { country: string; items: ReportItem[] }[] {
  const out: { country: string; items: ReportItem[] }[] = [];
  for (const c of [...countries].sort((a, b) => a.localeCompare(b))) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const hit = items.filter((i) => re.test(i.title)).sort(byNew).slice(0, max);
    if (hit.length) out.push({ country: c, items: hit });
  }
  return out;
}
