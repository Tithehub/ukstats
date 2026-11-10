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
    if (card.period) parts.push(`Reference period: ${card.period}.`);
  }
  parts.push(`Source: ${card.source.replace(/\s*\(.*?\)/g, "")}.`);
  if (deep && card.asOf) parts.push(`Published ${card.asOf}.`);
  if (deep && card.nextDue) parts.push(`Next update due ${card.nextDue}.`);
  return parts.join(" ").slice(0, deep ? 700 : 480);
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
  const out = [...cards, ...(seg.script ?? []), ...heads];
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
