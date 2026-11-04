// Pure clock-driven schedule for the 24/7 stream: even London hours are the UK hour,
// odd London hours rotate through other countries five minutes each.
import { CARD_MS, type Segment, type StreamCard } from "./stream-rundown";

const MIN = 60_000;
export const HOUR_MS = 60 * MIN;
export const COUNTRY_SLOT_MS = 5 * MIN;

/** UK running order: base segment id, minutes, optional override title and headline flag. */
export const UK_HOUR: { id: string; base: string; min: number; title?: string; headline?: boolean }[] = [
  { id: "boats-headline", base: "boats", min: 8, title: "Irregular migration & small boats", headline: true },
  { id: "economy", base: "economy", min: 7 },
  { id: "cost", base: "cost", min: 7 },
  { id: "boats-update", base: "boats", min: 5, title: "Small boats update — latest day & year so far", headline: true },
  { id: "crime", base: "crime", min: 7 },
  { id: "nhs", base: "nhs", min: 6 },
  { id: "legal", base: "legal", min: 6 },
  { id: "security", base: "security", min: 5 },
  { id: "flights", base: "flights", min: 2.5 },
  { id: "news", base: "news", min: 2.5 },
  { id: "recap", base: "boats", min: 4, title: "Recap — small boats and the hour's key figures", headline: true },
];

export interface Slot { seg: Segment; start: number; end: number }

/** UK hour slots in ms from the top of the hour; missing topics are dropped and the rest stretched to fill 60 minutes. */
export function buildUkHour(segments: Segment[]): Slot[] {
  const by = new Map(segments.map((s) => [s.id, s]));
  const recapExtra = segments.filter((s) => s.id !== "boats" && s.cards.some((c) => c.metric)).map((s) => s.cards[0]!).slice(0, 3);
  const picked = UK_HOUR.flatMap((t) => {
    const base = by.get(t.base);
    if (!base) return [];
    const cards: StreamCard[] = t.id === "recap" ? [...base.cards.slice(0, 3), ...recapExtra] : base.cards;
    return [{ t, seg: { ...base, id: t.id, title: t.title ?? base.title, headline: t.headline ?? false, cards } }];
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

export interface Position {
  mode: "uk" | "world";
  /** Absolute London hour count — even = UK. */
  hourIndex: number;
  msIntoHour: number;
}
export function positionAt(d: Date): Position {
  const p = londonParts(d);
  const day = Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000);
  const hourIndex = day * 24 + p.hour;
  const msIntoHour = (p.minute * 60 + p.second) * 1000 + d.getMilliseconds();
  return { mode: hourIndex % 2 === 0 ? "uk" : "world", hourIndex, msIntoHour };
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
  const index = (Math.floor(pos.hourIndex / 2) * perHour + slot) % n;
  return { index, msIntoSlot: pos.msIntoHour % COUNTRY_SLOT_MS, next: (index + 1) % n };
}

export const cardStep = (msIntoSlot: number) => Math.floor(msIntoSlot / CARD_MS);
