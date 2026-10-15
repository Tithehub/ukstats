import { COUNTRIES } from './countries';
export const CRIME_COUNTRIES = [{ code: 'uk', name: 'United Kingdom' }, ...COUNTRIES.map(c => ({ code: c.code, name: c.name }))];
/** Countries with a live, verified town/city ranking feed. Shown on /safest-places as coverage at a glance. */
export const CRIME_COVERAGE = ['uk', 'us', 'ca'];
export type CityCrimeRow = { name: string; code: string; value: number };
export type CityCrimeBoard = { code: string; period: string | null; published: string | null; metric: string; unit: string; geography: string; source: string; sourceUrl: string; next: string; rows: CityCrimeRow[]; reason: string | null; note?: string | null };

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