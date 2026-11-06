import type { StreamCard } from "./stream-rundown";


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
