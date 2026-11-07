import type { Headline, Segment, StreamCard } from "./stream-rundown";


/** Spoken line for a figure card — uses only words already on the card; never adds a figure. */
export function scriptForCard(card: StreamCard | null): string {
  if (!card) return "No figure is published for this item.";
  const parts = [`${card.title}.`];
  const missing = !card.value || /not published/i.test(card.value);
  if (missing) parts.push("No figure is published.");
  else { parts.push(`${card.value}.`); const y = yoyLine(card); if (y) parts.push(y); }
  parts.push(`Source: ${card.source.replace(/\s*\(.*?\)/g, "")}.`);
  return parts.join(" ").slice(0, 480);
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
export function readingList(seg: Segment | undefined): string[] {
  if (!seg) return [];
  const cards = seg.cards.map(scriptForCard);
  const heads = seg.headlines.map(scriptForHeadline);
  return [...cards, ...(heads.length ? heads : seg.id.startsWith("country-") ? [NO_HEADLINES] : [])];
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
