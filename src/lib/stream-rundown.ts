// Pure running order for the YouTube news-channel stream. Only reuses published figures,
// official warnings and headlines already collected by the site — nothing is created here.
import type { Category, Metric } from "./uk-stats";
import type { OfficialWarning } from "./unrest";
import type { ReportItem } from "./news-reports";
import type { CountryPayload } from "./countries";

export const CARD_MS = 9_000;

export interface StreamCard {
  kicker: string; title: string; value: string; sub: string | null;
  source: string; period: string | null; asOf: string | null; nextDue: string | null;
  metric: Metric | null;
  /** "live" = right-now feed reading (not a dated publication). */
  live?: boolean;
}
export interface Headline { text: string; publisher: string; time: string | null; official: boolean }
export interface Segment {
  id: string; title: string; country: string;
  /** Clip topic this segment draws footage from. */
  topic: string;
  /** Major-issue segments get the full-width headline banner. */
  headline?: boolean;
  layers: { fl: boolean; mg: boolean; nw: boolean };
  cards: StreamCard[]; headlines: Headline[];
}

export const UK = "united kingdom";
const metricCard = (m: Metric, kicker: string): StreamCard => ({
  kicker, title: m.title, value: m.value!, sub: m.sub, source: m.source,
  period: m.period, asOf: m.asOf, nextDue: m.nextDue, metric: m,
});

/** Published metrics only: status "ok" with a real value. */
export function publishedIn(metrics: Metric[], cats: Category[], max = Infinity): Metric[] {
  return metrics.filter((m) => cats.includes(m.category) && m.status === "ok" && !!m.value).slice(0, max);
}

const byTime = (a: string | null, b: string | null) => (b ? Date.parse(b) : 0) - (a ? Date.parse(a) : 0);

export function recentWarnings(warnings: OfficialWarning[], now: Date): OfficialWarning[] {
  return warnings
    .filter((w) => w.mentionsUnrest && w.updated && now.getTime() - Date.parse(w.updated) <= 30 * 86_400_000)
    .sort((a, b) => byTime(a.updated, b.updated));
}
const warnHeadline = (w: OfficialWarning): Headline => ({ text: `${w.country}: ${w.text}`, publisher: w.source, time: w.updated, official: true });

/** Topic segments for the UK; any topic without published figures is left out. */
export function buildRundown(input: {
  metrics: Metric[]; warnings: OfficialWarning[]; reports: ReportItem[]; emergencyPlanes: number | null; now: Date;
}): Segment[] {
  const { metrics, now } = input;
  const recent = recentWarnings(input.warnings, now);
  const warnHeads = recent.slice(0, 8).map(warnHeadline);
  const newsHeads: Headline[] = [...input.reports].sort((a, b) => byTime(a.published, b.published)).slice(0, 8)
    .map((r) => ({ text: r.title, publisher: r.publisher, time: r.published, official: r.official }));
  const boatNews = newsHeads.filter((h) => /small boat|channel|migrant|asylum|crossing/i.test(h.text));

  const seg = (id: string, title: string, cats: Category[], kicker: string, extra: Partial<Segment> = {}): Segment | null => {
    const cards = publishedIn(metrics, cats).map((m) => metricCard(m, kicker));
    if (!cards.length) return null;
    return { id, title, country: UK, topic: id, layers: { fl: false, mg: false, nw: false }, cards, headlines: warnHeads.slice(0, 3), ...extra };
  };
  const boats = seg("boats", "Irregular migration & small boats", ["Irregular immigration & cost"], "Irregular migration",
    { layers: { fl: false, mg: true, nw: false }, headline: true, headlines: boatNews.length ? boatNews : warnHeads.slice(0, 3) });
  const legal = seg("legal", "Legal migration — visas next to irregular arrivals", ["Immigration", "Irregular immigration & cost"], "Migration",
    { topic: "legal", layers: { fl: false, mg: true, nw: false } });

  const out: (Segment | null)[] = [
    boats,
    seg("economy", "UK economy & public finances", ["Finance"], "Finance"),
    seg("cost", "Cost of living", ["Cost of living"], "Cost of living"),
    seg("crime", "Crime & policing", ["Crime"], "Crime"),
    seg("nhs", "NHS & health", ["NHS & doctors"], "Health"),
    legal,
    seg("population", "Population", ["Population & migration"], "Population"),
    seg("housing", "Housing", ["Housing"], "Housing"),
    seg("security", "Defence & national alerts", ["Defence & security", "National alerts"], "Security"),
    seg("politics", "Politics & polls", ["Politics & polling"], "Politics"),
    seg("weather", "Weather", ["Weather"], "Weather"),
    recent.length ? {
      id: "warnings", title: "World warnings — official advice", country: recent[0]!.key, topic: "warnings",
      layers: { fl: false, mg: false, nw: false }, cards: [], headlines: warnHeads,
    } : null,
    input.emergencyPlanes !== null ? {
      id: "flights", title: "Skies now — live flights", country: UK, topic: "flights", layers: { fl: true, mg: false, nw: false },
      cards: [{ kicker: "Flights", title: "Planes squawking an emergency code now", value: String(input.emergencyPlanes),
        sub: "Codes 7500 / 7600 / 7700 from live transponder feeds — not official", source: "ADS-B feeds (OpenSky / adsb.lol)",
        period: "Right now", asOf: now.toISOString(), nextDue: null, metric: null, live: true }],
      headlines: newsHeads.filter((h) => /plane|flight|aircraft|airport/i.test(h.text)).slice(0, 4),
    } : null,
    newsHeads.length ? {
      id: "news", title: "News & police reports", country: UK, topic: "news", layers: { fl: false, mg: false, nw: true },
      cards: [], headlines: newsHeads,
    } : null,
  ];
  return out.filter((s): s is Segment => s !== null);
}

/** Same template for every other country: its own published figures plus official warnings about it. */
export function countrySegment(globeKey: string, payload: CountryPayload | null | undefined, warnings: OfficialWarning[], now: Date, reports: ReportItem[] = []): Segment {
  const name = payload?.country.name ?? globeKey;
  const cards: StreamCard[] = (payload?.metrics ?? []).filter((m) => m.value !== null).map((m) => ({
    kicker: name, title: m.title, value: m.value!, sub: null, source: m.source, period: m.period,
    asOf: m.asOf, nextDue: null, metric: null,
  }));
  const warn = recentWarnings(warnings, now).filter((w) => w.key === globeKey).slice(0, 4).map(warnHeadline);
  const news = countryHeadlines(name, reports);
  const heads = [...warn, ...news];
  return { id: `country-${globeKey}`, title: `${name} — official figures`, country: globeKey, topic: "world",
    layers: { fl: false, mg: false, nw: false }, cards, headlines: heads };
}

/** Key-stats ticker: one short line per published headline metric. */
export function statsTicker(metrics: Metric[], max = 14): string[] {
  return metrics.filter((m) => m.status === "ok" && m.value).slice(0, max).map((m) => `${m.title}: ${m.value}${m.period ? ` (${m.period})` : ""}`);
}

/** Latest news/police headlines naming a country, verbatim, newest first (max 5). */
export function countryHeadlines(name: string, reports: ReportItem[], max = 5): Headline[] {
  const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return reports.filter((r) => re.test(r.title)).sort((a, b) => byTime(a.published, b.published)).slice(0, max)
    .map((r) => ({ text: r.title, publisher: r.publisher, time: r.published, official: r.official }));
}
