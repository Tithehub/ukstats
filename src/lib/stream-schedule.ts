// Pure clock-driven schedule for the 24/7 stream: a three-hour London-clock cycle —
// two UK hours (part 1, then part 2 going deeper into the same figures), then one hour rotating other countries five minutes each.
import { CARD_MS, type Segment, type StreamCard } from "./stream-rundown";

const MIN = 60_000;
export const HOUR_MS = 60 * MIN;
export const COUNTRY_SLOT_MS = 5 * MIN;

/** UK running order: base segment id, minutes, optional override title and headline flag. */
export const UK_HOUR: { id: string; base: string; alt?: string; odd?: string; min: number; title?: string; headline?: boolean }[] = [
  { id: "top-story", base: "featured", alt: "news", min: 2, title: "Top story & headlines" },
  { id: "foreign-aid", base: "foreign-aid", min: 2 },
  { id: "asylum-cost", base: "asylum-cost", min: 2 },
  { id: "boats-headline", base: "boats", min: 6, title: "Irregular migration & small boats", headline: true },
  { id: "economy", base: "economy", min: 4, title: "Debt & economy" },
  { id: "weather", base: "weather", min: 2 },
  { id: "cost", base: "cost", min: 6 },
  { id: "crime", base: "crime", min: 6 },
  { id: "news-half", base: "news", min: 3, title: "Headlines at half past" },
  { id: "boats-update", base: "boats", min: 2, title: "Small boats update — latest day & year so far", headline: true },
  { id: "scandals", base: "scandals", min: 3 },
  { id: "nhs", base: "nhs", min: 4 },
  { id: "gold", base: "gold", min: 1 },
  { id: "tax-welfare", base: "tax-welfare", min: 1 },
  { id: "council-spending", base: "council-spending", min: 1 },
  { id: "legal", base: "legal", min: 2 },
  { id: "population", base: "population", min: 1 },
  { id: "housing", base: "housing", min: 1 },
  { id: "security", base: "security", min: 2, title: "Defence & terror threat" },
  { id: "politics", base: "politics", min: 2 },
  { id: "places", base: "education", odd: "happiest", min: 1 },
  { id: "safest", base: "safest", min: 1 },
  { id: "online-speech", base: "online-speech", min: 0.75 },
  { id: "flights", base: "flights", min: 1 },
  { id: "warnings", base: "warnings", min: 1.25 },
  { id: "recap", base: "boats", min: 2, title: "Recap — small boats and the hour's key figures", headline: true },
];

export interface Slot { seg: Segment; start: number; end: number }

/** UK hour slots in ms from the top of the hour; missing topics are dropped and the rest stretched to fill 60 minutes. */
export function buildUkHour(segments: Segment[], hourIndex = 0): Slot[] {
  const by = new Map(segments.map((s) => [s.id, s]));
  const recapExtra = segments.filter((s) => s.id !== "boats" && s.cards.some((c) => c.metric)).map((s) => s.cards[0]!).slice(0, 3);
  const picked = UK_HOUR.flatMap((t) => {
    const base = (t.odd && Math.floor(hourIndex / CYCLE_HOURS) % 2 === 1 ? by.get(t.odd) : by.get(t.base)) ?? (t.alt ? by.get(t.alt) : undefined);
    if (!base) return [];
    const cards: StreamCard[] = t.id === "recap" ? [...base.cards.slice(0, 3), ...recapExtra] : base.cards;
    return [{ t, seg: { ...base, id: t.id === "places" ? base.id : t.id, title: t.title ?? base.title, headline: t.headline ?? false, cards } }];
  });
  const total = picked.reduce((a, p) => a + p.t.min, 0);
  let at = 0;
  return picked.map((p, i) => {
    const len = i === picked.length - 1 ? HOUR_MS - at : Math.round((p.t.min / total) * HOUR_MS);
    const slot = { seg: p.seg, start: at, end: at + len };
    at += len;
    return slot;
  });
}

const londonParts = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23", minute: "numeric", second: "numeric" })
    .formatToParts(d).map((x) => [x.type, Number(x.value)]));
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
};

/** Hours in one cycle: UK part 1, UK part 2, rest of world. */
export const CYCLE_HOURS = 3;
export interface Position {
  mode: "uk" | "world";
  /** UK hours only: 1 = main running order, 2 = same order, presenter reads every figure in depth. */
  ukPart?: 1 | 2;
  /** Absolute London hour count — cycle position = hourIndex % CYCLE_HOURS (0,1 UK; 2 world). */
  hourIndex: number;
  msIntoHour: number;
}
export function positionAt(d: Date): Position {
  const p = londonParts(d);
  const day = Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000);
  const hourIndex = day * 24 + p.hour;
  const msIntoHour = (p.minute * 60 + p.second) * 1000 + d.getMilliseconds();
  const c = hourIndex % CYCLE_HOURS;
  return c === 2 ? { mode: "world", hourIndex, msIntoHour } : { mode: "uk", ukPart: c === 0 ? 1 : 2, hourIndex, msIntoHour };
}

/** Which UK slot is on now, plus how far into it. */
export function ukSlotAt(slots: Slot[], msIntoHour: number): { index: number; msIntoSlot: number } {
  const i = Math.max(0, slots.findIndex((s) => msIntoHour >= s.start && msIntoHour < s.end));
  return { index: i, msIntoSlot: slots[i] ? msIntoHour - slots[i]!.start : 0 };
}

/** Which country is on in a world hour; rotates through the whole list across successive world hours. */
export function worldCountryAt(countries: string[], pos: Position): { index: number; msIntoSlot: number; next: number } {
  const perHour = HOUR_MS / COUNTRY_SLOT_MS;
  const slot = Math.floor(pos.msIntoHour / COUNTRY_SLOT_MS);
  const n = Math.max(1, countries.length);
  const index = (Math.floor(pos.hourIndex / CYCLE_HOURS) * perHour + slot) % n;
  return { index, msIntoSlot: pos.msIntoHour % COUNTRY_SLOT_MS, next: (index + 1) % n };
}

export const cardStep = (msIntoSlot: number) => Math.floor(msIntoSlot / CARD_MS);

/** "About UKStats" break: the first PROMO_MS of every quarter-hour (:00, :15, :30, :45 London) — clock-driven so reloads land on the same moment. */
export const PROMO_EVERY_MS = 15 * MIN;
export const PROMO_MS = 40_000;
export function promoAt(msIntoHour: number): { active: boolean; msIntoPromo: number } {
  const m = msIntoHour % PROMO_EVERY_MS;
  return { active: m < PROMO_MS && !explainerAt(msIntoHour).active, msIntoPromo: m };
}

/** Hourly "About UKStats" explainer: starts at :30 London every hour (replaces the short :30 promo). */
export const EXPLAINER_START = 30 * MIN;
export function explainerAt(msIntoHour: number, length = EXPLAINER_LEN): { active: boolean; msIn: number } {
  const d = msIntoHour - EXPLAINER_START;
  return d >= 0 && d < length ? { active: true, msIn: d } : { active: false, msIn: 0 };
}
const EXPLAINER_LEN = 254_339; // keep equal to EXPLAINER_MS (stream-explainer.ts); a test checks it

/** Full-screen sponsor break: 60s straight after the :15 and :45 "About UKStats" promo, every hour (UK and world). */
export const SPONSOR_BREAK_MS = 60_000;
export const SPONSOR_BREAK_STARTS = [15 * MIN + PROMO_MS, 45 * MIN + PROMO_MS];
export function sponsorBreakAt(msIntoHour: number): { active: boolean; msIntoBreak: number } {
  for (const s of SPONSOR_BREAK_STARTS) if (msIntoHour >= s && msIntoHour < s + SPONSOR_BREAK_MS) return { active: true, msIntoBreak: msIntoHour - s };
  return { active: false, msIntoBreak: 0 };
}
