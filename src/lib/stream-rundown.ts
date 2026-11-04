// Pure running order for the YouTube news-channel stream. Only reuses published figures,
// official warnings and headlines already collected by the site — nothing is created here.
import type { Category, Metric } from "./uk-stats";
import type { OfficialWarning } from "./unrest";
import type { ReportItem } from "./news-reports";

export const SEGMENT_MS = 75_000;
export const CARD_MS = 9_000;

export interface StreamCard {
  kicker: string; title: string; value: string; sub: string | null;
  source: string; period: string | null; asOf: string | null; nextDue: string | null;
  metric: Metric | null;
}
export interface Headline { text: string; publisher: string; time: string | null; official: boolean }
export interface Segment {
  id: string; title: string; country: string;
  layers: { fl: boolean; mg: boolean; nw: boolean };
  cards: StreamCard[]; headlines: Headline[];
}

const UK = "united kingdom";
const metricCard = (m: Metric, kicker: string): StreamCard => ({
  kicker, title: m.title, value: m.value!, sub: m.sub, source: m.source,
  period: m.period, asOf: m.asOf, nextDue: m.nextDue, metric: m,
});

/** Published metrics only: status "ok" with a real value. */
export function publishedIn(metrics: Metric[], cats: Category[], max = 6): Metric[] {
  return metrics.filter((m) => cats.includes(m.category) && m.status === "ok" && !!m.value).slice(0, max);
}

const byTime = (a: string | null, b: string | null) => (b ? Date.parse(b) : 0) - (a ? Date.parse(a) : 0);

export function buildRundown(input: {
  metrics: Metric[]; warnings: OfficialWarning[]; reports: ReportItem[]; emergencyPlanes: number | null; now: Date;
}): Segment[] {
  const { metrics, now } = input;
  const recent = input.warnings
    .filter((w) => w.mentionsUnrest && w.updated && now.getTime() - Date.parse(w.updated) <= 30 * 86_400_000)
    .sort((a, b) => byTime(a.updated, b.updated));
  const warnHeads: Headline[] = recent.slice(0, 8).map((w) => ({ text: `${w.country}: ${w.text}`, publisher: w.source, time: w.updated, official: true }));
  const newsHeads: Headline[] = [...input.reports].sort((a, b) => byTime(a.published, b.published)).slice(0, 8)
    .map((r) => ({ text: r.title, publisher: r.publisher, time: r.published, official: r.official }));

  const seg = (id: string, title: string, cats: Category[], kicker: string, extra: Partial<Segment> = {}): Segment | null => {
    const cards = publishedIn(metrics, cats).map((m) => metricCard(m, kicker));
    if (!cards.length) return null;
    return { id, title, country: UK, layers: { fl: false, mg: false, nw: false }, cards, headlines: warnHeads.slice(0, 3), ...extra };
  };

  const out: (Segment | null)[] = [
    seg("economy", "UK economy & public finances", ["Finance"], "Finance"),
    seg("cost", "Cost of living", ["Cost of living"], "Cost of living"),
    seg("boats", "Small boats & irregular migration", ["Irregular immigration & cost", "Immigration"], "Immigration",
      { layers: { fl: false, mg: true, nw: false } }),
    seg("crime", "Crime & policing", ["Crime"], "Crime"),
    seg("nhs", "NHS & health", ["NHS & doctors"], "Health"),
    seg("security", "Defence & national alerts", ["Defence & security", "National alerts"], "Security"),
    recent.length ? {
      id: "warnings", title: "World warnings — official advice", country: recent[0]!.key,
      layers: { fl: false, mg: false, nw: false }, cards: [], headlines: warnHeads,
    } : null,
    input.emergencyPlanes !== null ? {
      id: "flights", title: "Skies now — live flights", country: UK, layers: { fl: true, mg: false, nw: false },
      cards: [{ kicker: "Flights", title: "Planes squawking an emergency code now", value: String(input.emergencyPlanes),
        sub: "Codes 7500 / 7600 / 7700 from live transponder feeds — not official", source: "ADS-B feeds (OpenSky / adsb.lol)",
        period: "Right now", asOf: now.toISOString(), nextDue: null, metric: null }],
      headlines: newsHeads.filter((h) => /plane|flight|aircraft|airport/i.test(h.text)).slice(0, 4),
    } : null,
    newsHeads.length ? {
      id: "news", title: "News & police reports", country: UK, layers: { fl: false, mg: false, nw: true },
      cards: [], headlines: newsHeads,
    } : null,
  ];
  return out.filter((s): s is Segment => s !== null);
}

/** Key-stats ticker: one short line per published headline metric. */
export function statsTicker(metrics: Metric[], max = 14): string[] {
  return metrics.filter((m) => m.status === "ok" && m.value).slice(0, max).map((m) => `${m.title}: ${m.value}${m.period ? ` (${m.period})` : ""}`);
}
