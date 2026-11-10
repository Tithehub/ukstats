import type { Headline, Segment, StreamCard } from "./stream-rundown";


/** Spoken line for a figure card — uses only words already on the card; never adds a figure. */
export function scriptForCard(card: StreamCard | null, deep = false): string {
  if (!card) return "No figure is published for this item.";
  const parts = [`${card.title}.`];
  const missing = !card.value || /not published/i.test(card.value);
  if (missing) parts.push("No figure is published.");
  else { parts.push(`${card.value}.`); const y = yoyLine(card); if (y) parts.push(y); }
  // In depth (UK part 2): also read the card's own detail, period, publication and next-release dates — words already on the card.
  if (deep && !missing) {
    if (card.sub) parts.push(`${card.sub.replace(/\.?$/, ".")}`);
    const per = card.period ? speakable(card.period) : "";
    if (per) parts.push(`Reference period: ${per}.`);
  }
  parts.push(`Source: ${card.source.replace(/\s*\(.*?\)/g, "")}.`);
  const pub = deep ? spokenDate(card.asOf) : null;
  const next = deep ? spokenDate(card.nextDue) : null;
  if (pub) parts.push(`Published ${pub}.`);
  if (next) parts.push(`Next update due ${next}.`);
  // The voice accepts 400 characters; keep whole sentences within that so no line is cut mid-word.
  let out = "";
  for (const s of parts) { const next = out ? `${out} ${s}` : s; if (next.length > 400) break; out = next; }
  return out || parts.join(" ").slice(0, 400);
}

/** Year-on-year line from two published figures in the same series; never estimated. */
export function yoyLine(card: StreamCard | null): string | null {
  const m = card?.metric;
  if (!m || card?.live || !card.value || /not published/i.test(card.value)) return null;
  if (m.annualChange) return "That's the change over the past twelve months.";
  const y = m.yearAgo;
  if (!y) return "No year-earlier figure is published.";
  if (y.dir === "flat") return `That's unchanged on a year earlier, ${y.period}.`;
  return `That's ${y.dir} ${y.diff} on a year earlier, from ${y.value} in ${y.period}.`;
}

/** Spoken headline: verbatim text plus publisher; news is labelled not official. */
export function scriptForHeadline(h: Headline): string {
  return `${h.official ? "Official warning" : "News report, not official"}. ${h.text}. From ${h.publisher}.`.slice(0, 400);
}
export const NO_HEADLINES = "No recent headlines collected.";

/** Everything the presenter reads in a segment: every figure card, then its headlines. */
export function readingList(seg: Segment | undefined, deep = false): string[] {
  if (!seg) return [];
  const cards = seg.cards.map((c) => scriptForCard(c, deep));
  const heads = seg.headlines.map(scriptForHeadline);
  const out = [...cards, ...(seg.script ?? []), ...heads].map(speakable).filter(Boolean);
  // Zero silent sections: anything with nothing to read still gets a spoken line.
  if (!out.length) out.push(seg.id.startsWith("country-") ? NO_HEADLINES : `${seg.title}. No new figures or headlines for this item right now — the latest is on ukstats.co.uk.`);
  return out;
}

/** Names joined for speech: "A", "A and B", "A, B and C". */
const joinNames = (n: string[]) => n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;

/** "About UKStats" break: site explainer, approved sponsor names verbatim (no claims about them), domain and QR call. Adds no figures. */
export function scriptForPromo(sponsorNames: string[]): string[] {
  const names = sponsorNames.map((s) => s.trim()).filter(Boolean);
  return [
    "You're watching UKStats — the UK's independent register of official statistics.",
    "Every figure on this stream comes straight from government and official publishers, with its source, its date and when the next update is due. Nothing is estimated and nothing is made up.",
    "The site is free for everyone, forever. Visit ukstats.co.uk, or scan the QR code on screen to open it now.",
    names.length
      ? `UKStats is supported by ${joinNames(names)}. Thank you to our sponsors. Sponsors never choose or change our figures.`
      : "Want your business seen here? Find out how at ukstats.co.uk/sponsors.",
    "Back to the figures.",
  ];
}

/** Sponsor break: one line per 10s card, naming the sponsor on screen verbatim with their web address. No claims about them, no figures. */
export const SPONSOR_CARD_MS = 10_000;
export function scriptForSponsorBreak(rows: { name: string; label: string }[], msIntoBreak: number, breakMs = 60_000): { line: string; upcoming: string[] } | null {
  const list = rows.filter((r) => r.name.trim());
  if (!list.length) return null;
  const slots = Math.max(1, Math.ceil(breakMs / SPONSOR_CARD_MS));
  const lineAt = (i: number) => {
    const r = list[i % list.length]!;
    let s = `${r.name.trim()} — visit ${r.label}. Scan the code on screen.`;
    if (i === 0) s = `This break is brought to you by our sponsors. ${s}`;
    if (i === slots - 1) s = `${s} Thank you to our sponsors. Sponsors never choose or change our figures. Want your business here? Visit ukstats.co.uk/sponsors.`;
    return s;
  };
  const i = Math.min(slots - 1, Math.floor(msIntoBreak / SPONSOR_CARD_MS));
  return { line: lineAt(i), upcoming: [i + 1, i + 2, i + 3].filter((j) => j < slots).map(lineAt) };
}

/** Date as spoken words on the London calendar ("15 September 2026"); null if not a real date — never read raw timestamps aloud. */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ONES = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
const ORD: Record<string, string> = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth", twenty: "twentieth", thirty: "thirtieth" };
const words = (n: number) => n < 20 ? ONES[n]! : TENS[Math.floor(n / 10)]! + (n % 10 ? `-${ONES[n % 10]}` : "");
const ordinal = (n: number) => { const w = words(n); const parts = w.split("-"); const last = parts.pop()!; return [...parts, ORD[last] ?? `${last}th`].join("-"); };
/** 2026 → "twenty twenty-six"; 2005 → "two thousand and five"; 2000 → "two thousand". */
export function sayYear(y: number): string {
  if (y >= 2000 && y < 2010) return y === 2000 ? "two thousand" : `two thousand and ${ONES[y - 2000]}`;
  const hi = Math.floor(y / 100), lo = y % 100;
  return `${words(hi)} ${lo === 0 ? "hundred" : lo < 10 ? `oh ${ONES[lo]}` : words(lo)}`;
}
/** Spoken English date, e.g. "the tenth of November, twenty twenty-six". */
export function sayDate(day: number, month: number, year: number): string | null {
  const m = MONTHS[month - 1]; if (!m || day < 1 || day > 31) return null;
  return `the ${ordinal(day)} of ${m}, ${sayYear(year)}`;
}
const MONTH_RE = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const monthNo = (t: string) => MONTHS.findIndex((m) => m.slice(0, 3).toLowerCase() === t.slice(0, 3).toLowerCase()) + 1;

export function spokenDate(v: string | null | undefined): string | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return /\d{4}-\d{2}|T\d{2}:/.test(v) ? null : v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const p = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/London" }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return sayDate(g("day"), g("month"), g("year"));
}

/** Last check before the voice: computer-format dates become words; leftover timestamps/codes are removed — never read digit by digit. */
export function speakable(text: string): string {
  return text
    .replace(/\b(\d{4}-\d{2}-\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?\b/g, (m) => spokenDate(m) ?? "")
    .replace(/\bT\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?\b/g, "")
    .replace(/\b(\d{4})-M(\d{2})\b/g, (_, y, m) => `${MONTHS[Number(m) - 1] ?? ""} ${y}`)
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (m, d, mo, y) => sayDate(+d, +mo, +y) ?? m)
    .replace(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)? ${MONTH_RE}\\.? (\\d{4})\\b`, "gi"), (m, d, mo, y) => sayDate(+d, monthNo(mo), +y) ?? m)
    .replace(new RegExp(`\\b${MONTH_RE}\\.? (\\d{4})\\b`, "gi"), (m, mo, y) => { const n = monthNo(mo); return n ? `${MONTHS[n - 1]} ${sayYear(+y)}` : m; })
    .replace(/\b\d{9,}\b/g, "")
    .replace(/\(\s*\)/g, "").replace(/\s+([.,])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

/** How long a line stays on screen: its speaking time (~2.6 words/s plus a breath), at least 6s. */
export const lineMs = (text: string) => Math.max(6_000, Math.round((text.split(/\s+/).filter(Boolean).length / 2.6) * 1000) + 900);

/** Which line is on screen ms into a slot. Screen and voice both follow this, so they can't drift; the list repeats if the slot outlasts it. */
export function lineAt(reads: string[], msIn: number): { index: number; msInLine: number } {
  if (!reads.length) return { index: 0, msInLine: msIn };
  const lens = reads.map(lineMs), total = lens.reduce((a, b) => a + b, 0);
  const lap = Math.floor(Math.max(0, msIn) / total);
  let t = Math.max(0, msIn) - lap * total, i = 0;
  while (i < lens.length - 1 && t >= lens[i]!) { t -= lens[i]!; i++; }
  return { index: lap * reads.length + i, msInLine: t };
}
