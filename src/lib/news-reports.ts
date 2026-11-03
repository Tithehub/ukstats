/** Pure parsers for news and police feeds shown on the globe. Headlines are kept verbatim; nothing here creates warnings or figures. */
export type ReportKind = "protest" | "riot" | "aviation";
export interface ReportItem {
  id: string; kind: ReportKind; title: string; summary: string; link: string; published: string;
  publisher: string; official: boolean; place: string | null; lat: number | null; lng: number | null;
}
export interface ReportsPayload { items: ReportItem[]; sources: { name: string; ok: boolean }[]; fetchedAt: string }

const ent = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const tag = (x: string, t: string) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i")); return m ? ent(m[1]!) : ""; };

export interface RawItem { title: string; summary: string; link: string; published: string }

export function parseRss(xml: string): RawItem[] {
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].flatMap(([x]) => {
    const title = tag(x, "title"), link = tag(x, "link"), d = Date.parse(tag(x, "pubDate"));
    return title && link && !Number.isNaN(d) ? [{ title, summary: tag(x, "description"), link, published: new Date(d).toISOString() }] : [];
  });
}

/** Police Scotland news list: h3 link, summary paragraph, then "dd/mm/yyyy hh:mm:ss" (UK local time, treated as given). */
export function parsePoliceScotland(html: string): RawItem[] {
  return [...html.matchAll(/<h3><a href="(\/what-s-happening\/news\/[^"]+)"[^>]*>([^<]+)<\/a><\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<small[^>]*>(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/g)].map((m) => ({
    title: ent(m[2]!), summary: ent(m[3]!), link: `https://www.scotland.police.uk${m[1]}`,
    published: `${m[6]}-${m[5]}-${m[4]}T${m[7]}:${m[8]}:00Z`,
  }));
}

const AVIATION = /\b(plane|planes|aircraft|airliner|jet|flight|flights|airport)\b/i;
const AVIATION_EVENT = /\b(grounded|diverted|diversion|searched|search|emergency landing|evacuated|seized|detained|bomb threat|security alert|stopped|impounded|turned back|drone sighting|drones? (?:seen|spotted)|closed)\b/i;
export function classify(text: string): ReportKind | null {
  if (/\briot(s|ing|ers)?\b|\bdisorder\b|\bunrest\b/i.test(text)) return "riot";
  if (/\bprotest(s|ers|ed|ing)?\b|\bdemonstrat(ion|ions|ors|ed)\b|\bmarch(ed|ers)? (?:through|on|against)\b|\brally\b/i.test(text)) return "protest";
  if (AVIATION.test(text) && AVIATION_EVENT.test(text)) return "aviation";
  return null;
}

/** First named place (country, city, lat, lng) whose name appears as a whole word. Longer names win. */
export function placeFor(text: string, places: [string, string, number, number, 0 | 1][]): { place: string; lat: number; lng: number } | null {
  const sorted = [...places].sort((a, b) => b[1].length - a[1].length);
  for (const p of sorted) if (p[1].length > 3 && new RegExp(`\\b${p[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) return { place: `${p[1]}, ${p[0]}`, lat: p[2], lng: p[3] };
  return null;
}

export function toReports(raw: RawItem[], publisher: string, official: boolean, places: [string, string, number, number, 0 | 1][], now: Date, maxDays = 3): ReportItem[] {
  const cutoff = now.getTime() - maxDays * 86_400_000;
  return raw.flatMap((r) => {
    if (Date.parse(r.published) < cutoff) return [];
    const kind = classify(`${r.title} ${r.summary}`);
    if (!kind) return [];
    const p = placeFor(`${r.title} ${r.summary}`, places);
    return [{ id: `${publisher}|${r.link}`, kind, title: r.title, summary: r.summary, link: r.link, published: r.published, publisher, official, place: p?.place ?? null, lat: p?.lat ?? null, lng: p?.lng ?? null }];
  });
}

/** Newest first; the same headline from two feeds of one publisher appears once. */
export function mergeReports(lists: ReportItem[][]): ReportItem[] {
  const seen = new Set<string>();
  return lists.flat().sort((a, b) => b.published.localeCompare(a.published)).filter((r) => { const k = `${r.publisher}|${r.title.toLowerCase()}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
