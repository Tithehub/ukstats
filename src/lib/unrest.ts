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
  /** FCDO per-country alert status, checked a batch at a time; absent keys are not yet checked. */
  fcdoAlerts?: Record<string, FcdoAlertEntry>;
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

// ---- Markers: where an official warning's own words mention riots or protests ----

export type UnrestKind = "riot" | "protest" | "strike" | "war";
const STRIKE = /\b(air ?strikes?|airstrikes?|missile (?:strikes?|attacks?|fire)|missiles?|drone (?:strikes?|attacks?)|rocket (?:fire|attacks?)|rockets?|shelling|artillery|bombardment|military strikes?|aerial attacks?)\b/i;
const WAR = /\b(armed conflict|active conflict|war|warzone|war zone|military (?:operations?|activity|action)|hostilities|invasion|fighting between|ongoing conflict|front ?line)\b/i;
const RIOT = /\b(riots?|rioting|civil disorder|violent clashes|looting|coup|martial law)\b/i;
const PROTEST = /\b(demonstrations?|protests?|unrest|strikes?|curfews?|marches)\b/i;

/** Military strike / war zone / riot / protest / null, from the publisher's own wording only. Military wording wins so "missile strikes" is never read as an industrial strike. */
export function classifyUnrest(text: string): UnrestKind | null {
  if (STRIKE.test(text)) return "strike";
  if (WAR.test(text)) return "war";
  if (RIOT.test(text)) return "riot";
  if (PROTEST.test(text)) return "protest";
  return null;
}

export const KIND_LABEL: Record<UnrestKind, string> = { riot: "Riot", protest: "Protest", strike: "Military strike", war: "Active conflict" };
export const isMilitary = (k: UnrestKind) => k === "strike" || k === "war";

export type Place = [country: string, name: string, lat: number, lng: number, capital: 0 | 1];

export interface UnrestMarker {
  id: string; kind: UnrestKind; key: string; country: string;
  place: string; lat: number; lng: number;
  /** True when the advice names no place and the marker sits on the capital. */
  unspecified: boolean;
  warning: OfficialWarning;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Places named in the text for that country; else the capital, flagged unspecified. */
export function extractPlaces(text: string, key: string, places: Place[]): { name: string; lat: number; lng: number; unspecified: boolean }[] {
  const mine = places.filter((p) => countryKey(p[0]) === key);
  const named = mine.filter((p) => new RegExp(`\\b${esc(p[1])}\\b`, "i").test(text));
  if (named.length) return named.map((p) => ({ name: p[1], lat: p[2], lng: p[3], unspecified: false }));
  const cap = mine.find((p) => p[4] === 1) ?? mine[0];
  return cap ? [{ name: cap[1], lat: cap[2], lng: cap[3], unspecified: true }] : [];
}

/** Markers for warnings updated within the window whose own words mention riots or protests. */
export function unrestMarkers(warnings: OfficialWarning[], now: Date, places: Place[], maxDays = 30): UnrestMarker[] {
  const out: UnrestMarker[] = [];
  for (const w of warnings) {
    if (!w.updated) continue;
    const t = Date.parse(w.updated);
    if (!Number.isFinite(t) || now.getTime() - t > maxDays * 86_400_000) continue;
    const kind = classifyUnrest(w.text);
    if (!kind) continue;
    for (const p of extractPlaces(w.text, w.key, places)) {
      out.push({ id: `${w.source}|${w.key}|${p.name}`, kind, key: w.key, country: w.country, place: p.name, lat: p.lat, lng: p.lng, unspecified: p.unspecified, warning: w });
    }
  }
  return out.sort((a, b) => Date.parse(b.warning.updated!) - Date.parse(a.warning.updated!));
}

// ---- Travel advice levels, in each government's own terms (never merged) ----

export type FcdoAlert = "all" | "all-but-essential" | "parts-all" | "parts-essential" | "none";
export interface FcdoAlertEntry { status: FcdoAlert; updated: string | null; url: string; checked: string }

/** FCDO country page -> its own alert status, most severe first; null when the page carries no status field. */
export function parseFcdoAlert(json: unknown): FcdoAlert | null {
  const a = (json as { details?: { alert_status?: unknown } })?.details?.alert_status;
  if (!Array.isArray(a)) return null;
  const s = new Set(a.map(String));
  if (s.has("avoid_all_travel_to_whole_country")) return "all";
  if (s.has("avoid_all_but_essential_travel_to_whole_country")) return "all-but-essential";
  if (s.has("avoid_all_travel_to_parts")) return "parts-all";
  if (s.has("avoid_all_but_essential_travel_to_parts")) return "parts-essential";
  return "none";
}

export const FCDO_ALERT_LABEL: Record<FcdoAlert, string> = {
  all: "FCDO advises against all travel",
  "all-but-essential": "FCDO advises against all but essential travel",
  "parts-all": "FCDO advises against all travel to parts",
  "parts-essential": "FCDO advises against all but essential travel to parts",
  none: "No FCDO advice against travel",
};

export const US_LEVEL_LABEL: Record<number, string> = {
  1: "Level 1: Exercise normal precautions", 2: "Level 2: Exercise increased caution",
  3: "Level 3: Reconsider travel", 4: "Level 4: Do not travel",
};

/** Each government's own level for one country, side by side; null where that government has none on file. */
export function travelAdviceLevel(warnings: OfficialWarning[], key: string, fcdo: Record<string, FcdoAlertEntry> | undefined) {
  const us = warnings.find((w) => w.key === key && w.source === "US State Dept" && w.level);
  return {
    us: us ? { level: us.level!, label: US_LEVEL_LABEL[us.level!]!, updated: us.updated, url: us.url } : null,
    uk: fcdo?.[key] ? { ...fcdo[key]!, label: FCDO_ALERT_LABEL[fcdo[key]!.status] } : null,
  };
}

/** Warnings feeding the list: by government, marker kind and age in days. */
export function filterWarningMarkers(markers: UnrestMarker[], f: { gov: "all" | "FCDO" | "US"; riots: boolean; protests: boolean; military?: boolean; days: number }, now: Date): UnrestMarker[] {
  return markers.filter((m) => {
    if (f.gov === "FCDO" && m.warning.source !== "FCDO") return false;
    if (f.gov === "US" && m.warning.source !== "US State Dept") return false;
    if (isMilitary(m.kind) ? f.military === false : m.kind === "riot" ? !f.riots : !f.protests) return false;
    const t = Date.parse(m.warning.updated ?? "");
    return Number.isFinite(t) && now.getTime() - t <= f.days * 86_400_000;
  });
}
