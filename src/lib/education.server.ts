/**
 * Network + storage for the Education section. Pulls only official files,
 * stores them in education_institutions and a dated summary in
 * payload_cache "education-v1". Runs from /api/public/education-tick.
 */
import {
  CsvStream, decode1252, mapGias, mapOfsted, summariseOfsted, pickFilterOptions, indicatorId, latestPeriod, cleanNumber,
  KS4_INDICATORS, parseSharedStrings, parseSheetXml, mapOfsRegister,
  type EesMeta, type EesHeadline, type OfstedRecord, type Ks4Record, type SchoolRow, type OfstedSummary,
} from "./education";

const EES = "https://api.education.gov.uk/statistics/v1";
const UA = { "user-agent": "UKStats/1.0 (+https://ukstats.co.uk)" };
export const EDU_CACHE_ID = "education-v1";

export interface EducationSummary {
  fetchedAt: string;
  gias: { date: string; open: number; byPhase: Record<string, number>; byTypeGroup: Record<string, number> } | null;
  ofsted: ({ asAt: string; url: string } & OfstedSummary) | null;
  headlines: EesHeadline[];
  ks4: { period: string; schools: number } | null;
  providers: { count: number; date: string } | null;
  errors: string[];
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as { from: (t: string) => any };
}

// ---------- GIAS ----------

function giasUrl(d: Date) {
  const s = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata${s}.csv`;
}

async function fetchGias(): Promise<{ rows: SchoolRow[]; date: string }> {
  for (let back = 0; back < 4; back++) {
    const d = new Date(Date.now() - back * 86_400_000);
    const res = await fetch(giasUrl(d), { headers: UA });
    if (!res.ok || !res.body) { await res.body?.cancel(); continue; }
    const date = d.toISOString().slice(0, 10);
    const parser = new CsvStream();
    const reader = res.body.getReader();
    let header: string[] | null = null;
    const rows: SchoolRow[] = [];
    const buf: string[][] = [];
    const take = () => {
      for (const r of buf) {
        if (!header) { header = r; continue; }
        const o: Record<string, string> = {};
        for (let i = 0; i < header.length; i++) o[header[i]!] = r[i] ?? "";
        const s = mapGias(o, date);
        if (s) rows.push(s);
      }
      buf.length = 0;
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decode1252(value), buf);
      take();
    }
    parser.end(buf); take();
    if (rows.length > 10_000) return { rows, date };
    throw new Error(`GIAS file for ${date} had only ${rows.length} open schools`);
  }
  throw new Error("GIAS download not available for the last four days");
}

// ---------- Ofsted ----------

async function fetchOfsted(): Promise<{ map: Map<string, OfstedRecord>; asAt: string; url: string }> {
  const page = await fetch("https://www.gov.uk/api/content/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes", { headers: UA });
  if (!page.ok) throw new Error(`Ofsted index ${page.status}`);
  const text = await page.text();
  const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const found = [...new Set(text.match(/https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^"\\\s]+latest_inspections[^"\\\s]+\.csv/g) ?? [])]
    .map((url) => { const m = /(\d{1,2})_([A-Za-z]+)_(\d{4})\.csv$/.exec(url); const mm = m ? months[m[2]!.slice(0, 3).toLowerCase()] : undefined; return m && mm ? { url, asAt: `${m[3]}-${mm}-${m[1]!.padStart(2, "0")}` } : null; })
    .filter((x): x is { url: string; asAt: string } => !!x)
    .sort((a, b) => b.asAt.localeCompare(a.asAt));
  const latest = found[0];
  if (!latest) throw new Error("No Ofsted latest-inspections file listed");
  const res = await fetch(latest.url, { headers: UA });
  if (!res.ok || !res.body) throw new Error(`Ofsted file ${res.status}`);
  const parser = new CsvStream();
  const dec = new TextDecoder("utf-8");
  const reader = res.body.getReader();
  const buf: string[][] = [];
  let header: string[] | null = null;
  const map = new Map<string, OfstedRecord>();
  const take = () => {
    for (const r of buf) {
      if (!header) { header = r.map((h) => h.replace(/^\uFEFF/, "")); continue; }
      const o: Record<string, string> = {};
      for (let i = 0; i < header.length; i++) o[header[i]!] = r[i] ?? "";
      const m = mapOfsted(o, latest.asAt);
      if (m) map.set(m.urn, m.rec);
    }
    buf.length = 0;
  };
  for (;;) { const { done, value } = await reader.read(); if (done) break; parser.push(dec.decode(value, { stream: true }), buf); take(); }
  parser.end(buf); take();
  if (map.size < 10_000) throw new Error(`Ofsted file had only ${map.size} schools`);
  return { map, asAt: latest.asAt, url: latest.url };
}

// ---------- EES ----------

async function eesMeta(id: string): Promise<EesMeta> {
  const r = await fetch(`${EES}/data-sets/${id}/meta`, { headers: UA });
  if (!r.ok) throw new Error(`EES meta ${id} ${r.status}`);
  return r.json() as Promise<EesMeta>;
}

async function eesQuery(id: string, body: unknown): Promise<{ results: { locations: Record<string, string>; values: Record<string, string>; timePeriod: { period: string } }[]; paging: { totalPages: number } }> {
  const r = await fetch(`${EES}/data-sets/${id}/query`, { method: "POST", headers: { ...UA, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`EES query ${id} ${r.status}`);
  return r.json() as Promise<any>;
}

interface HeadlineSpec { key: string; label: string; dataset: string; indicator: string; unit: string; publication: string; slug: string; overrides?: Record<string, string>; }

export const HEADLINES: HeadlineSpec[] = [
  { key: "pupils", label: "Pupils in schools in England", dataset: "019e4b0c-1021-772b-ad78-48d5e411a2ff", indicator: "Number of pupils", unit: "pupils", publication: "Schools, pupils and their characteristics", slug: "school-pupils-and-their-characteristics", overrides: { "Breakdown of free-school meals groupings": "All pupils" } },
  { key: "schools", label: "Schools in England (school census)", dataset: "019e4b0c-1021-772b-ad78-48d5e411a2ff", indicator: "Number of schools", unit: "schools", publication: "Schools, pupils and their characteristics", slug: "school-pupils-and-their-characteristics", overrides: { "Breakdown of free-school meals groupings": "All pupils" } },
  { key: "ks2", label: "Pupils meeting the expected standard in reading, writing and maths (KS2)", dataset: "01a0624a-0d56-77e4-8e98-43bbcc0c4255", indicator: "Percentage meeting the expected standard in reading, writing and maths (combined)", unit: "%", publication: "Key stage 2 attainment: national headlines", slug: "key-stage-2-attainment-national-headlines" },
  { key: "a8", label: "Average Attainment 8 score (GCSE)", dataset: "19e39901-560d-f972-b6f3-dd085539c095", indicator: "Average Attainment 8 score", unit: "points", publication: "Key stage 4 performance", slug: "key-stage-4-performance" },
  { key: "em5", label: "Pupils achieving grade 5 or above in English and maths GCSEs", dataset: "19e39901-560d-f972-b6f3-dd085539c095", indicator: "Percentage of pupils achieving grades 5 or above in English and maths GCSEs", unit: "%", publication: "Key stage 4 performance", slug: "key-stage-4-performance" },
  { key: "persistent", label: "Pupils persistently absent (missing 10%+ of sessions)", dataset: "019d209c-08dc-74b6-9edb-52d521406fcf", indicator: "Percentage of pupil enrolments", unit: "%", publication: "Pupil absence in schools in England", slug: "pupil-absence-in-schools-in-england", overrides: { "Absence type": "Persistent absence" } },
  { key: "severe", label: "Pupils severely absent (missing 50%+ of sessions)", dataset: "019d209c-08dc-74b6-9edb-52d521406fcf", indicator: "Percentage of pupil enrolments", unit: "%", publication: "Pupil absence in schools in England", slug: "pupil-absence-in-schools-in-england", overrides: { "Absence type": "Severe absence" } },
];

async function fetchHeadlines(errors: string[]): Promise<EesHeadline[]> {
  const metas = new Map<string, Promise<EesMeta>>();
  const out: EesHeadline[] = [];
  for (const h of HEADLINES) {
    try {
      if (!metas.has(h.dataset)) metas.set(h.dataset, eesMeta(h.dataset));
      const meta = await metas.get(h.dataset)!;
      const ind = indicatorId(meta, h.indicator);
      const opts = pickFilterOptions(meta, h.overrides);
      const tp = latestPeriod(meta);
      const nat = meta.locations.find((l) => l.level.code === "NAT")?.options[0];
      if (!ind || !opts || !tp || !nat) throw new Error("dataset layout changed");
      const res = await eesQuery(h.dataset, {
        criteria: { and: [{ timePeriods: { in: [{ code: tp.code, period: tp.period }] } }, { locations: { in: [{ level: "NAT", id: nat.id }] } }, { geographicLevels: { eq: "NAT" } }, ...opts.map((o) => ({ filters: { in: [o] } }))] },
        indicators: [ind],
      });
      const row = res.results[0];
      out.push({ key: h.key, label: h.label, value: row ? cleanNumber(row.values[ind]) : null, unit: h.unit, period: tp.label, dataset: h.dataset, publication: h.publication, url: `https://explore-education-statistics.service.gov.uk/find-statistics/${h.slug}` });
    } catch (e) {
      errors.push(`${h.key}: ${(e as Error).message}`);
    }
  }
  return out;
}

const KS4_DATASET = "19e39901-a96c-be76-b9c2-6af54ae076d2";

async function fetchKs4(): Promise<{ map: Map<string, Ks4Record>; period: string }> {
  const meta = await eesMeta(KS4_DATASET);
  const tp = latestPeriod(meta);
  const opts = pickFilterOptions(meta);
  const ids = KS4_INDICATORS.map(([, l]) => indicatorId(meta, l));
  if (!tp || !opts || ids.some((i) => !i)) throw new Error("KS4 dataset layout changed");
  const urnOf = new Map<string, string>();
  for (const o of meta.locations.find((l) => l.level.code === "SCH")?.options ?? []) if (o.urn) urnOf.set(o.id, o.urn);
  const map = new Map<string, Ks4Record>();
  for (let page = 1; page <= 20; page++) {
    const res = await eesQuery(`${KS4_DATASET}`, {
      criteria: { and: [{ timePeriods: { in: [{ code: tp.code, period: tp.period }] } }, { geographicLevels: { eq: "SCH" } }, ...opts.map((o) => ({ filters: { in: [o] } }))] },
      indicators: ids, page, pageSize: 10000,
    });
    for (const r of res.results) {
      const urn = urnOf.get(r.locations["SCH"] ?? "");
      if (!urn) continue;
      const values = Object.fromEntries(KS4_INDICATORS.map(([k], i) => [k, cleanNumber(r.values[ids[i]!])])) as Ks4Record["values"];
      map.set(urn, { period: tp.label, values });
    }
    if (page >= res.paging.totalPages) break;
  }
  return { map, period: tp.label };
}

// ---------- OfS register (xlsx via the platform's own inflate) ----------

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const out = new Response(new Blob([data as BlobPart]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

async function unzip(buf: Uint8Array, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66_000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("not a zip");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = new Map<string, string>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (!wanted(name)) continue;
    const lstart = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const raw = buf.subarray(lstart, lstart + csize);
    files.set(name, dec.decode(method === 0 ? raw : await inflateRaw(raw)));
  }
  return files;
}

async function fetchProviders() {
  const r = await fetch("https://register-api.officeforstudents.org.uk/api/Download", { headers: UA });
  if (!r.ok) throw new Error(`OfS register ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  const files = await unzip(buf, (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n) || n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels");
  const shared = parseSharedStrings(files.get("xl/sharedStrings.xml") ?? "");
  const wb = files.get("xl/workbook.xml") ?? "";
  const rels = files.get("xl/_rels/workbook.xml.rels") ?? "";
  const sheetFile = (match: RegExp) => {
    const s = [...wb.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].find((m) => match.test(m[1]!));
    if (!s) return null;
    const target = new RegExp(`Id="${s[2]}"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="${s[2]}"`).exec(rels);
    const t = target?.[1] ?? target?.[2];
    return t ? files.get(`xl/${t.replace(/^\/?xl\//, "")}`) ?? null : null;
  };
  const reg = sheetFile(/^Register$/i);
  if (!reg) throw new Error("OfS Register sheet missing");
  const pen = sheetFile(/Monetary/i);
  const date = new Date().toISOString().slice(0, 10);
  const rows = mapOfsRegister(parseSheetXml(reg, shared), pen ? parseSheetXml(pen, shared) : [], date);
  if (rows.length < 200) throw new Error(`OfS register had only ${rows.length} providers`);
  return { rows, date };
}

// ---------- refresh ----------

async function upsert(db: { from: (t: string) => any }, rows: object[]) {
  for (let i = 0; i < rows.length; i += 2000) {
    const { error } = await db.from("education_institutions").upsert(rows.slice(i, i + 2000).map((r) => ({ ...r, updated_at: new Date().toISOString() })));
    if (error) throw new Error(`store: ${error.message}`);
  }
}

export async function refreshEducation(): Promise<EducationSummary> {
  const db = await admin();
  const errors: string[] = [];
  const summary: EducationSummary = { fetchedAt: new Date().toISOString(), gias: null, ofsted: null, headlines: [], ks4: null, providers: null, errors };
  const prev = (await db.from("payload_cache").select("data").eq("id", EDU_CACHE_ID).maybeSingle()).data?.data as EducationSummary | undefined;

  const [gias, ofsted, ks4] = await Promise.all([
    fetchGias().catch((e) => { errors.push(`gias: ${e.message}`); return null; }),
    fetchOfsted().catch((e) => { errors.push(`ofsted: ${e.message}`); return null; }),
    fetchKs4().catch((e) => { errors.push(`ks4: ${e.message}`); return null; }),
  ]);
  if (gias) {
    const byPhase: Record<string, number> = {}, byTypeGroup: Record<string, number> = {};
    for (const s of gias.rows) {
      const urn = s.id.slice(4);
      s.ofsted = ofsted?.map.get(urn) ?? null;
      s.ks4 = ks4?.map.get(urn) ?? null;
      byPhase[s.phase ?? "Not recorded"] = (byPhase[s.phase ?? "Not recorded"] ?? 0) + 1;
      byTypeGroup[s.type_group ?? "Not recorded"] = (byTypeGroup[s.type_group ?? "Not recorded"] ?? 0) + 1;
    }
    // Without fresh Ofsted / KS4 data keep each school's previously stored record rather than blanking it.
    const rows = gias.rows.map((s) => {
      const r: Record<string, unknown> = { ...s };
      if (!ofsted) delete r["ofsted"];
      if (!ks4) delete r["ks4"];
      return r;
    });
    await upsert(db, rows);
    await db.from("education_institutions").delete().eq("kind", "school").neq("source_date", gias.date);
    summary.gias = { date: gias.date, open: gias.rows.length, byPhase, byTypeGroup };
  } else summary.gias = prev?.gias ?? null;
  summary.ofsted = ofsted ? { asAt: ofsted.asAt, url: ofsted.url, ...summariseOfsted([...ofsted.map.values()]) } : prev?.ofsted ?? null;
  summary.ks4 = ks4 ? { period: ks4.period, schools: ks4.map.size } : prev?.ks4 ?? null;

  try {
    const p = await fetchProviders();
    await upsert(db, p.rows);
    await db.from("education_institutions").delete().eq("kind", "provider").neq("source_date", p.date);
    summary.providers = { count: p.rows.length, date: p.date };
  } catch (e) { errors.push(`ofs: ${(e as Error).message}`); summary.providers = prev?.providers ?? null; }

  const heads = await fetchHeadlines(errors);
  // A headline that failed this time keeps its last published value and date.
  summary.headlines = HEADLINES.map((h) => heads.find((x) => x.key === h.key) ?? prev?.headlines.find((x) => x.key === h.key)).filter((x): x is EesHeadline => !!x);

  await db.from("payload_cache").upsert({ id: EDU_CACHE_ID, data: summary, updated_at: summary.fetchedAt });
  return summary;
}

export async function readEducationSummary(): Promise<EducationSummary | null> {
  const db = await admin();
  const { data } = await db.from("payload_cache").select("data").eq("id", EDU_CACHE_ID).maybeSingle();
  return (data?.data as EducationSummary | undefined) ?? null;
}
