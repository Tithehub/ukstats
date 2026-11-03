// Pure parsers for official irregular-migration and displacement figures.
// Sources: Frontex (EU illegal border crossings), US CBP (southwest border encounters), UNHCR (refugee stocks).
// Every figure comes straight from the publisher's file; nothing is estimated.

export type FlowSource = "frontex" | "cbp" | "unhcr";
/** One drawn arrow: from an origin country to a destination (country name or a named route entry point). */
export type Flow = { source: FlowSource; from: string; to: string; toLat?: number; toLng?: number; value: number; label: string };

export type FrontexRoute = { route: string; month: string; latest: number; last12: number; top: { nationality: string; value: number }[] };
export type FrontexData = { months: string[]; routes: FrontexRoute[]; fileUrl: string };
export type CbpData = { period: string; total: number; top: { citizenship: string; value: number }[]; fileUrl: string };
export type UnhcrData = { year: number; pairs: { from: string; to: string; value: number }[] };

export type MigrationPayload = {
  frontex: FrontexData | null; cbp: CbpData | null; unhcr: UnhcrData | null;
  errors: Partial<Record<FlowSource, string>>; fetchedAt: string;
};

export const MIGRATION_SOURCES = {
  frontex: { name: "Frontex — detections of illegal border crossings into the EU", url: "https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/" },
  cbp: { name: "US Customs and Border Protection — southwest land border encounters", url: "https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters" },
  unhcr: { name: "UNHCR Refugee Data Finder — refugees and asylum seekers by origin and host", url: "https://www.unhcr.org/refugee-statistics/" },
} as const;

/** Where each Frontex route meets the EU border. Approximate entry points for drawing only. */
export const ROUTE_ENTRY: Record<string, { lat: number; lng: number; place: string }> = {
  "Central Mediterranean Route": { lat: 35.5, lng: 12.6, place: "Italy and Malta" },
  "Eastern Mediterranean Route": { lat: 39.1, lng: 26.5, place: "Greece, Cyprus and Bulgaria" },
  "Western Mediterranean Route": { lat: 36.5, lng: -4.5, place: "Spain" },
  "Western African Route": { lat: 28.1, lng: -15.4, place: "Canary Islands" },
  "Western Balkan Route": { lat: 46.1, lng: 19.7, place: "Western Balkans borders" },
  "Eastern Borders Route": { lat: 52.9, lng: 23.8, place: "Eastern land borders" },
  "Circular Route from Albania to Greece": { lat: 39.9, lng: 20.7, place: "Greece–Albania border" },
  "Black Sea Route": { lat: 43.2, lng: 28.0, place: "Black Sea coast" },
};
/** Southwest border, drawn at El Paso. */
export const US_SW_BORDER = { lat: 31.8, lng: -106.4 };

/** Publisher spellings -> world map names (lower case). Unmatched names are simply not drawn. */
const NAME_FIX: Record<string, string> = {
  "syrian arab rep.": "syria", "iran (islamic rep. of)": "iran", "türkiye": "turkey", "turkiye": "turkey",
  "congo (kinshasa)": "dem. rep. congo", "dem. rep. of the congo": "dem. rep. congo", "congo (brazzaville)": "congo",
  "south sudan": "s. sudan", "venezuela (bolivarian republic of)": "venezuela", "united rep. of tanzania": "tanzania",
  "central african rep.": "central african rep.", "bosnia and herzegovina": "bosnia and herz.", "dominican rep.": "dominican rep.",
  "russian federation": "russia", "rep. of moldova": "moldova", "lao people's dem. rep.": "laos", "viet nam": "vietnam",
  "côte d'ivoire": "côte d'ivoire", "ivory coast": "côte d'ivoire", "palestinian": "palestine", "state of palestine": "palestine",
  "united states of america": "united states of america", "united kingdom of great britain and northern ireland": "united kingdom",
  "netherlands (kingdom of the)": "netherlands", "czechia": "czechia", "bolivia (plurinational state of)": "bolivia",
  "china, peoples republic of": "china", "china": "china", "el salvador": "el salvador", "kyrgyzstan": "kyrgyzstan",
  "korea, south": "south korea", "rep. of korea": "south korea", "eritrea": "eritrea", "ethiopia": "ethiopia",
};
export function mapName(raw: string): string | null {
  const n = raw.replace(/[\^*]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!n || /^(unknown|other|stateless|not specified|various)/.test(n)) return null;
  return NAME_FIX[n] ?? n;
}

const MONTH = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{4})$/;

/** Rows as arrays of cell strings, from an xlsx sheet + shared strings. */
export function xlsxRows(sheetXml: string, sharedXml: string): string[][] {
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1]!.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join("").replace(/&amp;/g, "&").replace(/&apos;/g, "'"));
  const col = (ref: string) => { let n = 0; for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const rows: string[][] = [];
  for (const r of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const out: string[] = [];
    for (const c of r[1]!.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?[\s\S]*?<\/c>)/g)) {
      const v = c[3] ?? ""; out[col(c[1]!)] = /t="s"/.test(c[2]!) ? (shared[Number(v)] ?? "") : v;
    }
    rows.push(Array.from(out, (x) => x ?? ""));
  }
  return rows;
}

/** Frontex monthly detections: header row has Route, …, Nationality, then MMMYYYY columns. */
export function parseFrontex(rows: string[][], fileUrl: string): FrontexData | null {
  const hi = rows.findIndex((r) => r[0] === "Route" && r.some((x) => MONTH.test(x)));
  if (hi < 0) return null;
  const h = rows[hi]!;
  const mcols = h.map((x, i) => (MONTH.test(x) ? i : -1)).filter((i) => i >= 0);
  // Latest month that any row actually reports (blank trailing months are not zero).
  let last = -1;
  for (let k = mcols.length - 1; k >= 0 && last < 0; k--) if (rows.slice(hi + 1).some((r) => (r[mcols[k]!] ?? "") !== "")) last = k;
  if (last < 0) return null;
  const win = mcols.slice(Math.max(0, last - 11), last + 1);
  const routes = new Map<string, { latest: number; last12: number; nat: Map<string, number> }>();
  for (const r of rows.slice(hi + 1)) {
    const route = r[0]?.trim(); if (!route || route === "Other" || !ROUTE_ENTRY[route]) continue;
    const g = routes.get(route) ?? { latest: 0, last12: 0, nat: new Map() }; routes.set(route, g);
    const num = (i: number) => { const n = Number(r[i]); return Number.isFinite(n) ? n : 0; };
    const sum = win.reduce((s, i) => s + num(i), 0);
    g.latest += num(mcols[last]!); g.last12 += sum;
    const nat = r[2]?.trim() ?? ""; if (nat) g.nat.set(nat, (g.nat.get(nat) ?? 0) + sum);
  }
  return {
    fileUrl, months: win.map((i) => h[i]!),
    routes: [...routes].map(([route, g]) => ({ route, month: h[mcols[last]!]!, latest: g.latest, last12: g.last12,
      top: [...g.nat].filter(([n, v]) => v > 0 && mapName(n)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nationality, value]) => ({ nationality, value })) }))
      .sort((a, b) => b.last12 - a.last12),
  };
}

function csvLine(l: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; }
  out.push(cur); return out;
}
const FY_ORDER = ["OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"];

/** CBP nationwide encounters CSV: southwest land border, latest fiscal month, by citizenship. */
export function parseCbp(csv: string, fileUrl: string): CbpData | null {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const h = csvLine(lines[0] ?? "");
  const ix = (n: string) => h.indexOf(n);
  const [fy, mo, reg, cit, cnt] = [ix("Fiscal Year"), ix("Month (abbv)"), ix("Land Border Region"), ix("Citizenship"), ix("Encounter Count")];
  if ([fy, mo, reg, cit, cnt].some((i) => i < 0)) return null;
  const rows = lines.slice(1).map(csvLine).filter((r) => r[reg] === "Southwest Land Border");
  let best = -1, bestFy = 0, bestMo = "";
  for (const r of rows) { const y = parseInt(r[fy]!, 10); const k = y * 12 + FY_ORDER.indexOf(r[mo]!); if (k > best) { best = k; bestFy = y; bestMo = r[mo]!; } }
  if (best < 0) return null;
  const by = new Map<string, number>(); let total = 0;
  for (const r of rows) if (parseInt(r[fy]!, 10) === bestFy && r[mo] === bestMo) { const n = Number(r[cnt]) || 0; total += n; by.set(r[cit]!, (by.get(r[cit]!) ?? 0) + n); }
  const calYear = FY_ORDER.indexOf(bestMo) < 3 ? bestFy - 1 : bestFy;
  return { period: `${bestMo[0]}${bestMo.slice(1).toLowerCase()} ${calYear}`, total, fileUrl,
    top: [...by].filter(([c]) => mapName(c)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([citizenship, value]) => ({ citizenship, value })) };
}

/** UNHCR population API items: refugees + asylum seekers per origin/host pair, largest first. */
export function parseUnhcr(items: unknown, year: number): UnhcrData | null {
  if (!Array.isArray(items) || !items.length) return null;
  const n = (v: unknown) => (typeof v === "number" ? v : /^\d+$/.test(String(v)) ? Number(v) : 0);
  const pairs = items.flatMap((i: any) => {
    if (!i || i.coo === i.coa || !mapName(String(i.coo_name ?? "")) || !mapName(String(i.coa_name ?? ""))) return [];
    const value = n(i.refugees) + n(i.asylum_seekers);
    return value > 0 ? [{ from: String(i.coo_name).trim(), to: String(i.coa_name).trim(), value }] : [];
  }).sort((a, b) => b.value - a.value).slice(0, 25);
  return pairs.length ? { year, pairs } : null;
}

const fmt = (v: number) => v.toLocaleString("en-GB");
/** Arrows to draw, all traceable to one published figure each. */
export function buildFlows(p: MigrationPayload): Flow[] {
  const out: Flow[] = [];
  for (const r of p.frontex?.routes ?? []) {
    const e = ROUTE_ENTRY[r.route]!;
    for (const t of r.top) out.push({ source: "frontex", from: t.nationality, to: e.place, toLat: e.lat, toLng: e.lng, value: t.value,
      label: `${t.nationality} → ${r.route}: ${fmt(t.value)} illegal border crossings detected, 12 months to ${(p.frontex!.months.at(-1) ?? "").replace(/^(\w)(\w\w)(\d+)$/, (_, a, b, y) => `${a}${b.toLowerCase()} ${y}`)} (Frontex)` });
  }
  for (const t of p.cbp?.top ?? []) out.push({ source: "cbp", from: t.citizenship, to: "US southwest border", toLat: US_SW_BORDER.lat, toLng: US_SW_BORDER.lng, value: t.value,
    label: `${t.citizenship} → US southwest border: ${fmt(t.value)} encounters in ${p.cbp!.period} (US CBP)` });
  for (const t of p.unhcr?.pairs ?? []) out.push({ source: "unhcr", from: t.from, to: t.to, value: t.value,
    label: `${t.from} → ${t.to}: ${fmt(t.value)} refugees and asylum seekers living there, end of ${p.unhcr!.year} (UNHCR) — not illegal crossings` });
  return out;
}

/** Small-boat icons: one per boat on the latest reported day, laid out evenly across the Strait of Dover. Positions are illustrative. */
export function boatIcons(boats: number, max = 60): { id: string; lat: number; lng: number }[] {
  const n = Math.min(Math.max(0, Math.floor(boats)), max);
  const cols = Math.ceil(Math.sqrt(n * 2)) || 1, rows = Math.ceil(n / cols) || 1;
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    // From the French coast (south-east) towards Kent (north-west).
    const t = cols === 1 ? 0.5 : c / (cols - 1), u = rows === 1 ? 0.5 : r / (rows - 1);
    return { id: `boat-${i}`, lat: 50.85 + t * 0.3 + u * 0.12, lng: 1.75 - t * 0.4 + u * 0.35 };
  });
}
