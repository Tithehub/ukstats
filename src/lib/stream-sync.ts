import type { Segment } from "./stream-rundown";

export type ReadItem = { kind: "card" | "head"; index: number } | null;

/**
 * Which on-screen item matches the line the presenter is actually saying.
 * readingList(seg) is cards first, then headlines, so the spoken line's index maps straight to the item.
 * Falls back to the clock step when nothing has been spoken yet (or the line belongs to another segment).
 */
export function itemForSpoken(seg: Segment | undefined, reads: string[], spoken: string | null, clockStep: number): ReadItem {
  const cards = seg?.cards.length ?? 0, heads = seg?.headlines.length ?? 0;
  const i = spoken ? reads.indexOf(spoken) : -1;
  if (i >= 0 && i < cards) return { kind: "card", index: i };
  if (i >= cards && i - cards < heads) return { kind: "head", index: i - cards };
  if (cards) return { kind: "card", index: clockStep % cards };
  if (heads) return { kind: "head", index: clockStep % heads };
  return null;
}
