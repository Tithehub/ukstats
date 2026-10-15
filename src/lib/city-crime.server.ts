import { unzipSync, strFromU8 } from 'fflate';
import { agencyGroups } from './agencies';
import { countryByCode } from './countries';
import { parseCanadianCities, type CityCrimeBoard } from './city-crime';
const SOURCE = 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510002601';
let cache: { at: number; board: CityCrimeBoard } | null = null;
async function request(url: string, init: RequestInit = {}) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) { await r.body?.cancel(); throw new Error('Publisher unavailable'); }
  return r;
}
export async function loadCityCrime(code: string): Promise<CityCrimeBoard> {
  const country = countryByCode(code);
  const body = agencyGroups(code).find(g=>g.category==='Crime')?.bodies[0];
  const base: CityCrimeBoard = { code, period: null, published: null, metric: 'Recorded city crime', unit: '', geography: 'Towns and cities', source: body?.name ?? country?.office ?? 'ONS / Home Office', sourceUrl: body?.url ?? country?.officeUrl ?? 'https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice', next: 'No confirmed release date', rows: [], reason: 'No verified comparable town-and-city ranking feed is connected for this country. Regional totals, perception surveys and national averages are not substituted.' };
  if (code !== 'ca') return base;
  if (cache && Date.now()-cache.at < 6*60*60_000) return cache.board;
  const canada = { ...base, source: 'Statistics Canada · Table 35-10-0026-01', sourceUrl: SOURCE, metric: 'Crime Severity Index', unit: 'Index · Canada 2006 = 100', geography: 'Census metropolitan areas (cities and surrounding communities)' };
  try {
    const meta = await (await request('https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify([{productId:35100026}]) })).json() as {object?:{releaseTime?:string}}[];
    const bytes = new Uint8Array(await (await request('https://www150.statcan.gc.ca/n1/tbl/csv/35100026-eng.zip')).arrayBuffer());
    const file = unzipSync(bytes, { filter: f => f.name === '35100026.csv' })['35100026.csv'];
    if (!file) throw new Error('Official table not found');
    const parsed = parseCanadianCities(strFromU8(file));
    // WDS releaseTime is the publisher's local release clock, not UTC.
    const published = meta[0]?.object?.releaseTime?.slice(0,10) ?? null;
    const board = { ...canada, ...parsed, published };
    cache = { at: Date.now(), board }; return board;
  } catch { return { ...canada, reason:'The official city table could not be read just now. No ranking is shown rather than a guess.' }; }
}