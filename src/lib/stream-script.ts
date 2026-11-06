import type { StreamCard } from "./stream-rundown";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
const spokenDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : DATE.format(d); };

/** Spoken line for a figure card — uses only words already on the card; never adds a figure. */
export function scriptForCard(card: StreamCard | null): string {
  if (!card) return "No figure is published for this item.";
  const parts = [`${card.title}.`];
  const missing = !card.value || /not published/i.test(card.value);
  if (missing) parts.push("No figure is published.");
  else parts.push(`${card.value}${card.period ? `, for ${card.period}` : ""}.`);
  parts.push(`Source: ${card.source}.`);
  const when = card.asOf && !card.live ? spokenDate(card.asOf) : null;
  if (when) parts.push(`Published ${when}.`);
  return parts.join(" ").slice(0, 400);
}
