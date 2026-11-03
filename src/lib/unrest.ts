// Browser-safe parsers for official travel warnings and ACLED research events.
// Text is kept exactly as each publisher wrote it; nothing is inferred or scored here.

export const FCDO_INDEX = "https://www.gov.uk/api/content/foreign-travel-advice";
export const STATE_DEPT_FEED = "https://cadataapi.state.gov/api/TravelAdvisories";

/** Words that show a publisher itself wrote about unrest. Matching is on their own words only. */
const UNREST = /\b(demonstrations?|protests?|unrest|riots?|rioting|coup|curfew|martial law|civil disorder|strikes?)\b/i;

export interface OfficialWarning {
  source: "FCDO" | "US State Dept";
  country: string;
  key: string;
  url: string;
  updated: string | null;
  /** Publisher's own words: FCDO change note, or State Dept headline. */
  text: string;
  level: number | null;
  mentionsUnrest: boolean;
}

export interface AcledEvent { id: string; date: string; type: string; subType: string; country: string; location: string; lat: number; lng: number; actors: string; fatalities: number; source: string }

export interface UnrestPayload {
  warnings: OfficialWarning[];
  fcdoOk: boolean;
  stateOk: boolean;
  acled: { connected: boolean; events: AcledEvent[]; error?: string };
  fetchedAt: string;
}

const ALIAS: Record<string, string> = {
  "united states of america": "united states", usa: "united states", "us": "united states",
  "uk": "united kingdom", "russian federation": "russia", "dem. rep. congo": "democratic republic of the congo",
  "democratic republic of congo": "democratic republic of the congo", "congo, dem. rep.": "democratic republic of the congo",
  "congo": "republic of the congo", "congo, rep.": "republic of the congo", "the republic of the congo": "republic of the congo",
  "côte d'ivoire": "ivory coast", "cote d'ivoire": "ivory coast", "central african rep.": "central african republic",
  "s. sudan": "south sudan", "bosnia and herz.": "bosnia and herzegovina", "dominican rep.": "dominican republic",
  "eq. guinea": "equatorial guinea", "w. sahara": "western sahara", "solomon is.": "solomon islands", "czechia": "czech republic",
  "turkiye": "turkey", "türkiye": "turkey", "burma": "myanmar", "burma (myanmar)": "myanmar", "macedonia": "north macedonia",
  "korea, south": "south korea", "korea, north": "north korea", "korea, rep.": "south korea", "korea, dem. people's rep.": "north korea",
  "egypt, arab rep.": "egypt", "iran, islamic rep.": "iran", "venezuela, rb": "venezuela", "yemen, rep.": "yemen", "syrian arab republic": "syria",
  "lao pdr": "laos", "kyrgyz republic": "kyrgyzstan", "slovak republic": "slovakia", "viet nam": "vietnam", "gambia, the": "the gambia", "gambia": "the gambia",
  "bahamas, the": "the bahamas", "bahamas": "the bahamas", "eswatini (swaziland)": "eswatini", "swaziland": "eswatini", "timor-leste": "east timor",
  "palestine": "occupied palestinian territories", "west bank and gaza": "occupied palestinian territories",
};

export function countryKey(name: string): string {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIAS[n] ?? n;
}

export function parseFcdo(json: unknown): OfficialWarning[] {
  const kids = (json as { links?: { children?: any[] } })?.links?.children;
  if (!Array.isArray(kids)) return [];
  return kids.flatMap((c) => {
    const name = c?.details?.country?.name ?? c?.title;
    if (typeof name !== "string" || typeof c?.base_path !== "string") return [];
    const text = String(c?.details?.change_description ?? "").trim();
    return [{ source: "FCDO" as const, country: name, key: countryKey(name), url: `https://www.gov.uk${c.base_path}`, updated: typeof c.public_updated_at === "string" ? c.public_updated_at : null, text, level: null, mentionsUnrest: UNREST.test(text) }];
  });
}

export function parseStateDept(json: unknown): OfficialWarning[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((r: any) => {
    const title = typeof r?.Title === "string" ? r.Title : "";
    const m = title.match(/^(.+?)\s+-\s+Level\s+([1-4])\b/);
    if (!m || typeof r?.Link !== "string") return [];
    const summary = String(r.Summary ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const first = summary.split(/(?<=\.)\s/)[0] ?? "";
    return [{ source: "US State Dept" as const, country: m[1]!, key: countryKey(m[1]!), url: r.Link, updated: typeof r.Updated === "string" ? r.Updated : null, text: `${title}. ${first}`.trim(), level: Number(m[2]), mentionsUnrest: UNREST.test(first) }];
  });
}

export function parseAcled(json: unknown): AcledEvent[] {
  const rows = (json as { data?: any[] })?.data;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const lat = Number(r?.latitude), lng = Number(r?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !r?.event_id_cnty || !r?.event_date) return [];
    return [{ id: String(r.event_id_cnty), date: String(r.event_date), type: String(r.event_type ?? ""), subType: String(r.sub_event_type ?? ""), country: String(r.country ?? ""), location: String(r.location ?? ""), lat, lng, actors: String(r.actor1 ?? ""), fatalities: Number(r.fatalities) || 0, source: String(r.source ?? "") }];
  });
}

/** Freshness of a publisher date: fresh ≤7 days, ageing ≤30, overdue beyond. */
export function warningAge(updated: string | null, now: Date): "fresh" | "ageing" | "overdue" | "unknown" {
  const t = updated ? Date.parse(updated) : NaN;
  if (!Number.isFinite(t)) return "unknown";
  const days = (now.getTime() - t) / 86_400_000;
  return days <= 7 ? "fresh" : days <= 30 ? "ageing" : "overdue";
}

/** Countries a government flagged for unrest in its own words, updated within the window. */
export function unrestHotspots(warnings: OfficialWarning[], now: Date, maxDays = 30): Map<string, OfficialWarning[]> {
  const out = new Map<string, OfficialWarning[]>();
  for (const w of warnings) {
    if (!w.mentionsUnrest || !w.updated) continue;
    const t = Date.parse(w.updated);
    if (!Number.isFinite(t) || now.getTime() - t > maxDays * 86_400_000) continue;
    out.set(w.key, [...(out.get(w.key) ?? []), w]);
  }
  return out;
}
