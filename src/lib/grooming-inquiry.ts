import { RECOMMENDATIONS, TIMELINE, type Recommendation, type TimelineEntry } from "./grooming-inquiry.data";

export function sortedTimeline(list: TimelineEntry[] = TIMELINE): TimelineEntry[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}

export function recommendationCounts(list: Recommendation[] = RECOMMENDATIONS) {
  const c = { accepted: 0, "in progress": 0, "not stated": 0 };
  for (const r of list) c[r.position]++;
  return c;
}

export function finalReportLabel(date: string | null): string {
  return date ?? "Not yet published";
}
