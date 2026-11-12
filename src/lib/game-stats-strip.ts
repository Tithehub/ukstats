import type { Metric } from "./uk-stats";
import type { TaxWelfarePoint } from "./uk-stats.functions";

export const STRIP_METRIC_IDS = ["uk-small-boats-daily", "uk-irregular-migration", "uk-national-debt", "uk-foreign-aid"] as const;
const LABELS: Record<string, string> = {
  "uk-small-boats-daily": "Small boats",
  "uk-irregular-migration": "Irregular arrivals",
  "uk-national-debt": "UK debt",
  "uk-foreign-aid": "Foreign aid",
};

export interface StripItem { key: string; label: string; value: string; note: string; href: string }

/** Picks only the chosen published figures; anything missing reads "Not published" — never estimated. */
export function stripItems(metrics: Metric[], points: TaxWelfarePoint[] = []): StripItem[] {
  const out: StripItem[] = STRIP_METRIC_IDS.map((id) => {
    const m = metrics.find((x) => x.id === id);
    return {
      key: id,
      label: LABELS[id]!,
      value: m?.value ?? "Not published",
      note: m?.value ? [m.period, m.source].filter(Boolean).join(" · ") : m?.source ?? "",
      href: `/register?q=${encodeURIComponent(LABELS[id]!)}`,
    };
  });
  const tw = [...points].reverse().find((p) => !p.partial && p.incomeTax != null && p.welfare != null);
  const bn = (v: number) => `£${(v / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}bn`;
  out.push({
    key: "tax-welfare",
    label: "Income tax vs welfare",
    value: tw ? `${bn(tw.incomeTax!)} vs ${bn(tw.welfare!)}` : "Not published",
    note: tw ? `${tw.year} · ONS / HMRC` : "",
    href: "/tax-vs-welfare",
  });
  return out;
}
