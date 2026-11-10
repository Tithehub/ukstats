// Pure running order for the YouTube news-channel stream. Only reuses published figures,
// official warnings and headlines already collected by the site — nothing is created here.
import type { Category, Metric } from "./uk-stats";
import type { OfficialWarning } from "./unrest";
import type { ReportItem } from "./news-reports";
import type { CountryPayload } from "./countries";
import type { FeaturedStory } from "./featured-story.data";
import { SCANDALS, type Scandal } from "./scandals.data";
import { SPEECH_ROWS } from "./online-speech";
import { GOLD_SOURCE, goldPeriodLabel, type GoldTable } from "./gold";

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
  /** Extra spoken lines (background or pointers to site pages) — never figures. */
  script?: string[];
  /** Background segments are labelled "not official statistics". */
  background?: boolean;
  /** Site-section pointers: each line is read once, then the last is held — never looped. */
  pointer?: boolean;
  /** Scandals slot: the scandal each pair of script lines is about (for its site picture). */
  scandals?: { slug: string; title: string; status: string }[];
  /** Gold slot: ranked IMF rows shown as a leaderboard; script line i (after the intro) reads row i-1. */
  gold?: { rank: number; name: string; iso3: string; tonnes: string; period: string }[];
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
  /** Credited press story for the UK hour; omit for rented channels. */
  featured?: FeaturedStory | null;
  /** UKStats' own channel only: scandals background and site-section pointers. */
  siteSections?: boolean;
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

  const byIds = (id: string, title: string, ids: string[], kicker: string): Segment | null => {
    const cards = ids.map((x) => metrics.find((m) => m.id === x)).filter((m): m is Metric => !!m && m.status === "ok" && !!m.value).map((m) => metricCard(m, kicker));
    return cards.length ? { id, title, country: UK, topic: id, layers: { fl: false, mg: false, nw: false }, cards, headlines: [] } : null;
  };
  const out: (Segment | null)[] = [
    byIds("foreign-aid", "Foreign aid — total spend", ["uk-foreign-aid", "uk-foreign-aid-gni"], "Foreign aid"),
    byIds("asylum-cost", "Cost of asylum", ["uk-irregular-cost-year", "uk-irregular-cost-day"], "Asylum cost"),
    input.siteSections ? scandalsSegment() : null,
    ...(input.siteSections ? SITE_SECTIONS.map(pointerSegment) : []),
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
    input.featured?.streamUk ? {
      id: "featured", title: `In the news — ${input.featured.publisher}`, country: UK, topic: "news", layers: { fl: false, mg: false, nw: false },
      cards: [], headlines: [{ text: input.featured.headline, publisher: input.featured.publisher, time: input.featured.published, official: false }],
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

/** Site sections without stream figures: the presenter points viewers to the page; no number is read. */
export const SITE_SECTIONS: { id: string; title: string; path: string; what: string }[] = [
  { id: "gold", title: "Gold reserves", path: "gold", what: "official gold reserves filed with the IMF, country by country" },
  { id: "tax-welfare", title: "Tax vs welfare", path: "tax-vs-welfare", what: "what the government raises in tax next to what it spends on welfare, from official outturn" },
  { id: "council-spending", title: "Council spending", path: "spending", what: "each council's own spending return, by category" },
  { id: "safest", title: "Safest places", path: "safest-places", what: "recorded crime rankings for towns and cities, from police data" },
  { id: "happiest", title: "Happiest places", path: "happiest-places", what: "official wellbeing survey results by area" },
  { id: "education", title: "Education", path: "education", what: "schools and universities, from the official education registers" },
  { id: "online-speech", title: "Online speech", path: "online-speech", what: "official records on online speech cases" },
];
/** Online speech: no UK publisher issues a social-media-only count, so the slot explains the official sources instead — never a figure. */
export function onlineSpeechSegment(): Segment {
  const uk = SPEECH_ROWS.filter((r) => ["uk", "sct", "ni"].includes(r.code));
  const cards: StreamCard[] = uk.map((r) => ({ kicker: "Online speech · source", title: r.country, value: r.value ?? "No live figure", sub: r.cadence,
    source: r.source, period: r.period, asOf: null, nextDue: null, metric: null }));
  return { id: "online-speech", title: "Online speech", country: UK, topic: "online-speech", pointer: true,
    layers: { fl: false, mg: false, nw: false }, cards, headlines: [],
    script: [
      "Online speech. No UK body publishes a count of convictions for social media posts alone.",
      "In England and Wales, the Ministry of Justice publishes court outcomes under the Communications Act and the Malicious Communications Act. Those cover calls, texts, emails and posts together, quarterly, with annual tables each May.",
      "Scotland and Northern Ireland publish their own annual court figures, and those are not online-only either.",
      "Offences are defined differently in each country, so these series can't be compared like for like.",
      "For every official source link, go to ukstats.co.uk slash online speech.",
    ] };
}
export function pointerSegment(x: (typeof SITE_SECTIONS)[number]): Segment {
  if (x.id === "online-speech") return onlineSpeechSegment();
  return { pointer: true, id: x.id, title: x.title, country: UK, topic: x.id, layers: { fl: false, mg: false, nw: false }, cards: [], headlines: [],
    script: [`${x.title}. On ukstats.co.uk you'll find ${x.what}, each with its source and date.`, `Go to ukstats.co.uk slash ${x.path.replace(/-/g, " ")} for the full picture.`] };
}

const newest = (s: Scandal) => Math.max(0, ...s.official.map((o) => (o.published ? Date.parse(o.published) : 0)).filter((n) => !Number.isNaN(n)));
/** Most recent scandals by their latest official document date. */
export function topScandals(n = 3): Scandal[] {
  const gg = SCANDALS.find((s) => s.slug === "grooming-gangs");
  const rest = [...SCANDALS].filter((s) => s !== gg).sort((a, b) => newest(b) - newest(a));
  return [...(gg ? [gg] : []), ...rest].slice(0, n);
}
/** Background segment: short voiced explainers from official summaries, no figures, ending with a pointer to the site. */
export function scandalsSegment(n = 3): Segment {
  const top = topScandals(n);
  const lines = top.flatMap((s) => {
    const first = s.summary.split(/(?<=\.)\s/)[0] ?? s.summary;
    const text = first.replace(/\d[\d,.]*\s*(%|per cent|million|billion|bn|m\b)?/gi, "").replace(/\s{2,}/g, " ");
    return [`Background, not official statistics. ${s.title}. ${/\d/.test(first) ? s.status + "." : text}`, `Status: ${s.status}. For an in-depth look, go to ukstats.co.uk slash scandals.`];
  });
  return { id: "scandals", title: "Inquiry & scandals — background", country: UK, topic: "news", background: true,
    layers: { fl: false, mg: false, nw: false }, cards: [], headlines: [], script: lines,
    scandals: top.map((s) => ({ slug: s.slug, title: s.title, status: s.status })) };
}

const ORD = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** Gold reserves: the site's own IMF ranking (implausible filings already excluded), top ten read aloud. No figures if the IMF table is missing. */
export function goldSegment(table: GoldTable | null): Segment {
  const base = { id: "gold", title: "Gold reserves", country: UK, topic: "gold", layers: { fl: false, mg: false, nw: false }, cards: [], headlines: [] };
  const ranked = table?.ranked ?? [];
  if (!ranked.length) return { ...base, pointer: true, script: ["Gold reserves. The IMF figures couldn't be loaded just now, so no ranking is shown.", "Go to ukstats.co.uk slash gold for the latest official table."] };
  const fmt = (t: number) => Math.round(t).toLocaleString("en-GB");
  const rows = ranked.slice(0, 10).map((r, i) => ({ rank: i + 1, name: r.name, iso3: r.iso3, tonnes: fmt(r.tonnes), period: goldPeriodLabel(r.period) }));
  const ukI = ranked.findIndex((r) => r.iso3 === "GBR");
  const uk = ukI >= 0 ? ranked[ukI]! : null;
  return { ...base, gold: rows, script: [
    "Gold reserves — the top ten countries by official gold holdings, as filed with the International Monetary Fund.",
    ...rows.map((r) => `Number ${ORD[r.rank - 1]}, ${r.name}, ${r.tonnes} tonnes, as of ${r.period}.`),
    uk ? `The United Kingdom is number ${ukI + 1}, with ${fmt(uk.tonnes)} tonnes, as of ${goldPeriodLabel(uk.period)}.` : "The United Kingdom's filing isn't in the IMF table right now.",
    `Source: ${GOLD_SOURCE.name.replace(/\s*\(.*?\)/g, "")}. The full table is at ukstats.co.uk slash gold.`,
  ] };
}
