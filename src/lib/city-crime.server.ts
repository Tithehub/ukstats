import { unzipSync, strFromU8 } from 'fflate';
import { agencyGroups } from './agencies';
import { countryByCode } from './countries';
import { parseCanadianCities, parseUkCspRates, unassignedRecordedNames, type CityCrimeBoard, type UkCspRow } from './city-crime';

const STATCAN = 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510002601';
const ONS_PFA = '/peoplepopulationandcommunity/crimeandjustice/datasets/policeforceareadatatables';
const CACHE_MS = 6 * 60 * 60_000;

async function request(url: string, init: RequestInit = {}, timeoutMs = 40_000) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!r.ok) { await r.body?.cancel(); throw new Error('Publisher unavailable'); }
  return r;
}

const boardCache = new Map<string, { at: number; board: CityCrimeBoard }>();
function cached(code: string): CityCrimeBoard | null {
  const hit = boardCache.get(code);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.board;
  return null;
}

function baseBoard(code: string): CityCrimeBoard {
  const country = countryByCode(code);
  const body = agencyGroups(code).find(g=>g.category==='Crime')?.bodies[0];
  return { code, period: null, published: null, metric: 'Recorded city crime', unit: '', geography: 'Towns and cities', source: body?.name ?? country?.office ?? 'ONS / Home Office', sourceUrl: body?.url ?? country?.officeUrl ?? 'https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice', next: 'No confirmed release date', rows: [], reason: 'No verified comparable town-and-city ranking feed is connected for this country. Regional totals, perception surveys and national averages are not substituted.', note: null };
}

export async function loadCityCrime(code: string): Promise<CityCrimeBoard> {
  if (code === 'ca') return canadaBoard();
  if (code === 'uk') return ukBoard();
  if (code === 'us') return usBoard();
  return baseBoard(code);
}

/* ---------------- Canada: Statistics Canada Crime Severity Index by census metropolitan area ---------------- */

async function canadaBoard(): Promise<CityCrimeBoard> {
  const hit = cached('ca');
  if (hit) return hit;
  const country = countryByCode('ca');
  const base: CityCrimeBoard = { ...baseBoard('ca'), source: 'Statistics Canada · Table 35-10-0026-01', sourceUrl: STATCAN, metric: 'Crime Severity Index', unit: 'Index · Canada 2006 = 100', geography: 'Census metropolitan areas (cities and surrounding communities)', note: 'The Crime Severity Index weights police-recorded offences by their seriousness and adjusts for population. It is an index, not a count of crimes per 100,000. These are metropolitan areas, not individual neighbourhoods or every town in Canada.' };
  try {
    const meta = await (await request('https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify([{productId:35100026}]) }, 15_000)).json() as {object?:{releaseTime?:string}}[];
    const bytes = new Uint8Array(await (await request('https://www150.statcan.gc.ca/n1/tbl/csv/35100026-eng.zip')).arrayBuffer());
    const file = unzipSync(bytes, { filter: f => f.name === '35100026.csv' })['35100026.csv'];
    if (!file) throw new Error('Official table not found');
    const parsed = parseCanadianCities(strFromU8(file));
    // WDS releaseTime is the publisher's local release clock, not UTC.
    const published = meta[0]?.object?.releaseTime?.slice(0,10) ?? null;
    const board = { ...base, ...parsed, published };
    boardCache.set('ca', { at: Date.now(), board }); return board;
  } catch { return { ...base, reason:'The official city table could not be read just now. No ranking is shown rather than a guess.' }; }
}

/* ---------------- UK: ONS recorded crime rate per 1,000 population by Community Safety Partnership (Table C4) ---------------- */

/** Minimal xlsx reader for one worksheet: rows keyed by row number, cells keyed by column letters. */
type SheetCells = Record<string, string>;
function readSheets(files: Record<string, Uint8Array>): { sheets: Map<string, string>; shared: string[] } {
  const str = (u: Uint8Array) => strFromU8(u);
  const wbXml = str(files['xl/workbook.xml']!);
  const relXml = str(files['xl/_rels/workbook.xml.rels']!);
  const targets = new Map<string, string>();
  for (const m of relXml.matchAll(/Id="(rId\d+)"[^>]*Target="(worksheets\/[^"]+)"/g)) targets.set(m[1]!, `xl/${m[2]!}`);
  const sheets = new Map<string, string>();
  for (const m of wbXml.matchAll(/<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"/g)) sheets.set(m[1]!.trim(), targets.get(m[2]!) ?? '');
  const sharedXml = str(files['xl/sharedStrings.xml']!);
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
    [...(m[1] ?? '').matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(t => t[1] ?? '').join(''),
  );
  return { sheets, shared };
}

function sheetRows(files: Record<string, Uint8Array>, path: string, shared: string[]): Map<number, SheetCells> {
  const xml = strFromU8(files[path]!);
  const rows = new Map<number, SheetCells>();
  for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: SheetCells = {};
    for (const cm of (rm[2] ?? '').matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(?:<f[^>]*>[\s\S]*?<\/f>)?(?:<v>([^<]*)<\/v>)?/g)) {
      const raw = cm[3] ?? '';
      if (!raw) continue;
      cells[cm[1]!] = cm[2]!.includes('t="s"') ? (shared[Number(raw)] ?? '') : raw;
    }
    rows.set(Number(rm[1]), cells);
  }
  return rows;
}

const noteText = (s: string) => s.replace(/\[note[^\]]*\]/gi, '').replace(/\s+/g, ' ').trim();

async function ukBoard(): Promise<CityCrimeBoard> {
  const hit = cached('uk');
  if (hit) return hit;
  const base: CityCrimeBoard = { ...baseBoard('uk'), source: 'ONS · Police recorded crime, Police Force Area tables (Table C4)', sourceUrl: `https://www.ons.gov.uk${ONS_PFA}`, metric: 'Total recorded crime (excluding fraud)', unit: 'Rate per 1,000 population', geography: 'Community Safety Partnership areas (in most cases local authorities), England and Wales', note: 'Rates use the published per-1,000 population figures — nothing is calculated here. The publisher warns that city-centre areas such as Westminster show very high rates because crime is counted against a small resident population. The publisher does not present a rate for a small number of areas (for example City of London), and five Kent areas are recorded under an unassigned group owing to IT issues; none of these are ranked. Scotland and Northern Ireland publish separately and are not part of this table.' };
  try {
    const landing = await (await request(`https://www.ons.gov.uk${ONS_PFA}/data`)).json() as {
      datasets?: { uri: string }[];
      description?: { nextRelease?: string };
    };
    const versionUri = landing.datasets?.[0]?.uri;
    if (!versionUri) throw new Error('No dataset version');
    const version = await (await request(`https://www.ons.gov.uk${versionUri}/data`)).json() as {
      downloads?: { file: string }[];
      description?: { releaseDate?: string };
    };
    const file = version.downloads?.[0]?.file;
    if (!file) throw new Error('No workbook');
    const files = unzipSync(await (await request(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`)).arrayBuffer()) as unknown as Record<string, Uint8Array>;
    const { sheets, shared } = readSheets(files);
    const c4 = sheets.get('Table C4');
    const notes = sheets.get('Notes - CSP');
    if (!c4 || !files[c4]) throw new Error('Official table not found');

    const rows = sheetRows(files, c4, shared);
    const headerRow = [...rows.entries()].find(([, c]) => (c['A'] ?? '').includes('Police Force Area code'));
    if (!headerRow) throw new Error('Official table format has changed');
    const totalCol = Object.entries(headerRow[1]).find(([, v]) => /total recorded crime/i.test(v))?.[0];
    if (!totalCol) throw new Error('Official table format has changed');

    const title = [...rows.values()].map(c => c['A'] ?? '').find(t => t.includes('Table C4')) ?? '';
    const periodMatch = /year ending \w+ \d{4}/i.exec(title);
    const cspRows: UkCspRow[] = [];
    for (const [rn, c] of rows) {
      if (rn <= headerRow[0] || !c['C'] || !c['D']) continue;
      cspRows.push({ name: noteText(c['D'] ?? ''), code: c['C'] ?? '', rawValue: c[totalCol] ?? null });
    }

    const noteTexts: string[] = [];
    if (notes && files[notes]) {
      for (const c of sheetRows(files, notes, shared).values()) {
        for (const v of Object.values(c)) if (v.length > 15) noteTexts.push(v);
      }
    }

    const parsed = parseUkCspRates(cspRows, { excluded: unassignedRecordedNames(noteTexts) });
    const nextRaw = landing.description?.nextRelease?.trim();
    const board: CityCrimeBoard = { ...base, ...parsed, period: periodMatch ? `${periodMatch[0]}, England and Wales` : 'England and Wales', published: version.description?.releaseDate?.slice(0, 10) ?? null, next: nextRaw || 'No confirmed release date' };
    boardCache.set('uk', { at: Date.now(), board }); return board;
  } catch {
    return { ...base, reason: 'The official crime table could not be read just now. No ranking is shown rather than a guess.' };
  }
}

/* ---------------- United States: FBI city-agency table ---------------- */

async function usBoard(): Promise<CityCrimeBoard> {
  const hit = cached('us');
  if (hit) return hit;
  const base: CityCrimeBoard = { ...baseBoard('us'), source: 'FBI · Crime Data Explorer', sourceUrl: 'https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/downloads', metric: 'Violent crime known to law enforcement', unit: 'Offences per 100,000 residents', geography: 'Cities reporting to the FBI', note: 'FBI city data is published at least a year in arrears and covers only agencies that report to the FBI. Reporting is voluntary, so some large cities are missing.' };
  try {
    const parsed = await parseFbiCities();
    const board: CityCrimeBoard = { ...base, ...parsed };
    boardCache.set('us', { at: Date.now(), board }); return board;
  } catch {
    return { ...base, reason: 'The FBI city table could not be read just now. No ranking is shown rather than a guess.' };
  }
}

