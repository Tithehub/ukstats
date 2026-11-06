import type { Headline, Segment, StreamCard } from "./stream-rundown";


/** Spoken line for a figure card — uses only words already on the card; never adds a figure. */
export function scriptForCard(card: StreamCard | null): string {
  if (!card) return "No figure is published for this item.";
  const parts = [`${card.title}.`];
  const missing = !card.value || /not published/i.test(card.value);
  if (missing) parts.push("No figure is published.");
  else parts.push(`${card.value}.`);
  parts.push(`Source: ${card.source.replace(/\s*\(.*?\)/g, "")}.`);
  return parts.join(" ").slice(0, 400);
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
