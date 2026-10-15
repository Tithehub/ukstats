import { COUNTRIES } from './countries';
export const CRIME_COUNTRIES = [{ code: 'uk', name: 'United Kingdom' }, ...COUNTRIES.map(c => ({ code: c.code, name: c.name }))];
/** Countries with a live, verified town/city ranking feed. Shown on /safest-places as coverage at a glance. */
export const CRIME_COVERAGE = ['uk', 'us', 'ca'];
export type CityCrimeRow = { name: string; code: string; value: number };
export type CityCrimeBoard = { code: string; period: string | null; published: string | null; metric: string; unit: string; geography: string; source: string; sourceUrl: string; next: string; rows: CityCrimeRow[]; reason: string | null; note?: string | null };

/* ---------------- United States: FBI Crime in the United States, Table 8 (state by city) ---------------- */

/** One Table 8 row as read from the published workbook. */
export type FbiCityRow = { state: string; city: string; population: string | null; violent: string | null };
/** Cities below this published population are never ranked: a single offence moves the rate by dozens of points. */
export const FBI_MIN_CITY_POPULATION = 10_000;

/**
 * The FBI's footnotes name states whose figures are incomplete ("Limited data for 2025 were
 * available for Florida and North Dakota."). Those cities must never be ranked: their low
 * figures would be an artefact of under-recording, not safety.
 */
export function fbiLimitedDataStates(footnotes: string[]): string[] {
  const names: string[] = [];
  for (const note of footnotes) {
    const m = /limited data for \d{4} were available for ([^.]+)/i.exec(note.replace(/\s+/g, ' '));
    if (!m) continue;
    for (const name of m[1]!.replace(/,\s+and\s+/gi, ',').split(/\s+and\s+|,\s*/i)) {
      const clean = name.trim().replace(/[.,]$/, '');
      if (clean && /[A-Za-z]/.test(clean)) names.push(clean);
    }
  }
  return names;
}

/**
 * Ranks cities by violent crime per 100,000 residents, calculated from the FBI's published
 * counts (population and violent-crime total). All-or-nothing: any missing or unreadable
 * population or count blocks the ranking rather than silently dropping cities.
 */
export function parseFbiCities(rows: FbiCityRow[], opts: { excludedStates?: string[]; minPopulation?: number } = {}): { rows: CityCrimeRow[]; reason: string | null } {
  const excluded = new Set((opts.excludedStates ?? []).map(s => s.trim().toLowerCase()));
  const min = opts.minPopulation ?? FBI_MIN_CITY_POPULATION;
  const out: CityCrimeRow[] = [];
  for (const r of rows) {
    const state = (r.state ?? '').trim(); const city = (r.city ?? '').trim();
    if (!city) continue; // footnote rows carry no city name
    if (excluded.has(state.toLowerCase())) continue;
    const pop = Number((r.population ?? '').replace(/,/g, ''));
    const violent = Number((r.violent ?? '').replace(/,/g, ''));
    if (!Number.isFinite(pop) || !Number.isFinite(violent) || pop < 0 || violent < 0) return { rows: [], reason: 'A published city figure is missing or unreadable. No partial ranking is shown.' };
    if (pop < min) continue;
    out.push({ name: `${city}, ${state}`, code: `${state}|${city}`.toLowerCase(), value: Math.round((violent / pop) * 100_000 * 10) / 10 });
  }
  if (out.length < 20) return { rows: out, reason: 'Fewer than twenty comparable cities are available; two top-ten lists would overlap.' };
  if (new Set(out.map(r => r.code)).size !== out.length) return { rows: [], reason: 'Duplicate cities prevent a reliable ranking.' };
  return { rows: out, reason: null };
}

/** Quoted CSV fields may contain commas, escaped quotes or newlines. */
export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if (c === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

export function parseCanadianCities(text: string): { period: string | null; rows: CityCrimeRow[]; reason: string | null } {
  const [header = [], ...records] = csvRows(text.replace(/^\uFEFF/, ''));
  const col = (name: string) => header.indexOf(name);
  if (['REF_DATE', 'GEO', 'DGUID', 'Statistics', 'VALUE', 'STATUS', 'UOM'].some(k => col(k) < 0)) return { period: null, rows: [], reason: 'The official table format has changed.' };
  const candidates = records.filter(r => r[col('Statistics')] === 'Crime severity index' && /^\d{4}A0035/.test(r[col('DGUID')] ?? '') && !/ part \[/.test(r[col('GEO')] ?? ''));
  const period = candidates.map(r => r[col('REF_DATE')] ?? '').filter(y => /^\d{4}$/.test(y)).sort().at(-1) ?? null;
  const latest = candidates.filter(r => r[col('REF_DATE')] === period);
  if (!period || latest.length < 20) return { period, rows: [], reason: 'Fewer than twenty comparable city areas are available; two top-ten lists would overlap.' };
  const rows: CityCrimeRow[] = [];
  for (const r of latest) {
    const raw = r[col('VALUE')] ?? ''; const value = Number(raw);
    if (!raw.trim() || !Number.isFinite(value) || value < 0 || !['', 'r', 'p'].includes(r[col('STATUS')] ?? '') || r[col('UOM')] !== 'Index') return { period, rows: [], reason: 'A city-area value is missing or suppressed in the latest year. No partial ranking is shown.' };
    rows.push({ name: (r[col('GEO')] ?? '').replace(/\s*\[[^\]]+\]$/, ''), code: r[col('DGUID')] ?? '', value });
  }
  if (new Set(rows.map(r => r.code)).size !== rows.length) return { period, rows: [], reason: 'Duplicate city areas prevent a reliable ranking.' };
  return { period, rows, reason: null };
}
export function cityTopTens(rows: CityCrimeRow[]) {
  if (rows.length < 20) return { lowest: [], highest: [] };
  const sorted = [...rows].sort((a,b) => a.value - b.value || a.name.localeCompare(b.name, 'en'));
  return { lowest: sorted.slice(0,10), highest: [...sorted].reverse().slice(0,10) };
}

/* ---------------- UK: ONS Community Safety Partnership rates (Table C4) ---------------- */

/** One CSP row as read from the published workbook: the rate cell may be a number or a publisher marker like "[x]". */
export type UkCspRow = { name: string; code: string; rawValue: string | null };

/**
 * The publisher's notes list areas whose crime is recorded under an unassigned CSP group
 * (ongoing IT issues). Their published rates are near zero and must never be ranked.
 * Extracts those area names from the note text, e.g.
 * "... crime data for Maidstone, Medway, Tonbridge and Malling, Dartford and Gravesham, and Tunbridge Wells are recorded under an unassigned CSP group from 2024 onwards."
 */
export function unassignedRecordedNames(notes: string[]): string[] {
  const names: string[] = [];
  for (const note of notes) {
    const m = /data for ([^]+?) are recorded under an unassigned CSP group/i.exec(note.replace(/\s+/g,' '));
    if (!m) continue;
    // ONS lists areas with a serial comma: "A, B, C and D, and E". Join the final ", and" first,
    // then split on commas so multi-word names like "Tonbridge and Malling" stay intact.
    for (const part of m[1]!.replace(/,\s+and\s+/gi, ', ').split(',')) {
      const name = part.trim().replace(/^and\s+/i,'').replace(/[.,]$/,'');
      if (name && /[A-Za-z]/.test(name)) names.push(name);
    }
  }
  return names;
}

/**
 * Ranks CSP areas by the published "Total recorded crime (excluding fraud)" rate per 1,000 population.
 * All-or-nothing: any unexplained missing value, duplicate area, or rate the publisher's own notes
 * contradict (a live area below 1 per 1,000 means its crimes are recorded elsewhere) blocks the ranking.
 */
export function parseUkCspRates(rows: UkCspRow[], opts: { excluded?: string[] } = {}): { rows: CityCrimeRow[]; reason: string | null } {
  const blocked = new Set((opts.excluded ?? []).map(n => n.trim().toLowerCase()));
  const out: CityCrimeRow[] = [];
  for (const r of rows) {
    const name = (r.name ?? '').replace(/\s+/g,' ').trim();
    if (!name || !r.code || /^unassigned/i.test(name)) continue;
    if (blocked.has(name.toLowerCase())) continue;
    const raw = r.rawValue?.trim() ?? '';
    if (raw.startsWith('[')) continue; // publisher marker ([x]/[u1]): no rate is presented for this area, e.g. City of London
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value < 0) return { rows: [], reason: 'A published area rate is missing. No partial ranking is shown.' };
    if (value < 1) return { rows: [], reason: 'The published table contains an area whose rate contradicts its own recorded counts (crimes recorded under an unassigned group). No ranking is shown rather than a misleading "safest" list.' };
    out.push({ name, code: r.code, value });
  }
  if (out.length < 20) return { rows: out, reason: 'Fewer than twenty comparable areas are available; two top-ten lists would overlap.' };
  if (new Set(out.map(r => r.code)).size !== out.length) return { rows: [], reason: 'Duplicate areas prevent a reliable ranking.' };
  return { rows: out, reason: null };
}