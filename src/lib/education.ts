/**
 * Pure readers for official education sources. No network code here — see
 * education.server.ts. Every figure keeps its publisher's own wording; a
 * suppressed or missing cell becomes null ("Not published"), never zero.
 */

export const EDU_SOURCES = {
  gias: { name: "DfE Get Information about Schools", url: "https://get-information-schools.service.gov.uk/" },
  ofsted: { name: "Ofsted state-funded school inspections and outcomes: management information", url: "https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes" },
  ees: { name: "DfE Explore Education Statistics", url: "https://explore-education-statistics.service.gov.uk/" },
  ks4: { name: "DfE Key stage 4 performance — performance tables schools data", url: "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance" },
  ofs: { name: "Office for Students Register", url: "https://www.officeforstudents.org.uk/for-providers/regulatory-resources/the-ofs-register/" },
} as const;

/** Official publishers for nations and sectors we do not pull automatically. */
export const NO_FEED_LINKS = [
  { nation: "Scotland", label: "Scottish Government — school contact details and summary statistics for schools", url: "https://www.gov.scot/publications/school-contact-details/" },
  { nation: "Scotland", label: "Education Scotland — inspection reports", url: "https://education.gov.scot/inspection-and-review/find-an-inspection-report/" },
  { nation: "Wales", label: "StatsWales — schools and teachers", url: "https://statswales.gov.wales/Catalogue/Education-and-Skills/Schools-and-Teachers" },
  { nation: "Wales", label: "My Local School (Welsh Government)", url: "https://mylocalschool.gov.wales/" },
  { nation: "Wales", label: "Estyn — inspection reports", url: "https://www.estyn.gov.wales/inspection-reports" },
  { nation: "Northern Ireland", label: "Department of Education NI — school enrolment and level data", url: "https://www.education-ni.gov.uk/topics/statistics-and-research/statistics" },
  { nation: "Northern Ireland", label: "Education and Training Inspectorate — reports", url: "https://www.etini.gov.uk/" },
  { nation: "UK universities", label: "HESA — open data on students, staff and graduate outcomes", url: "https://www.hesa.ac.uk/data-and-analysis" },
  { nation: "UK universities", label: "Discover Uni — official course data (incl. National Student Survey)", url: "https://discoveruni.gov.uk/" },
] as const;

// ---------- value cleaning ----------

const SUPPRESSED = new Set(["c", "z", "x", "u", "low", "supp", "ne", "na", "n/a", ":", "..", "-", "null", "", "ssn", "lowcov", "nep", "dns"]);

/** Turn a published cell into a number, or null when suppressed/not applicable. */
export function cleanNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (SUPPRESSED.has(s.toLowerCase())) return null;
  const n = Number(s.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(n) ? n : null;
}

/** Turn a published text cell into text, or null for blanks and NULL markers. */
export function cleanText(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).replace(/\s+/g, " ").trim();
  if (!s || s === "NULL" || s.toLowerCase() === "not applicable" || s === "Does not apply") return null;
  return s;
}

/** dd/mm/yyyy → yyyy-mm-dd (as published; no time zone). */
export function ukDate(raw: string | null | undefined): string | null {
  const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(String(raw ?? "").trim());
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : null;
}

// ---------- CSV (streaming) ----------

/** Incremental RFC-4180 parser: feed text chunks, get completed rows back. */
export class CsvStream {
  private field = "";
  private row: string[] = [];
  private quoted = false;
  private pendingQuote = false;
  push(chunk: string, out: string[][]) {
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i]!;
      if (this.pendingQuote) {
        this.pendingQuote = false;
        if (ch === '"') { this.field += '"'; continue; }
        this.quoted = false;
      }
      if (this.quoted) {
        if (ch === '"') this.pendingQuote = true;
        else this.field += ch;
        continue;
      }
      if (ch === '"' && this.field === "") this.quoted = true;
      else if (ch === ",") { this.row.push(this.field); this.field = ""; }
      else if (ch === "\n") { this.row.push(this.field.replace(/\r$/, "")); out.push(this.row); this.row = []; this.field = ""; }
      else this.field += ch;
    }
  }
  end(out: string[][]) {
    if (this.pendingQuote) { this.pendingQuote = false; this.quoted = false; }
    if (this.field !== "" || this.row.length) { this.row.push(this.field.replace(/\r$/, "")); out.push(this.row); }
    this.row = []; this.field = "";
  }
}

export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  const p = new CsvStream();
  p.push(text, out);
  p.end(out);
  return out;
}

const CP1252: Record<number, number> = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030, 0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178 };

/** Windows-1252 decoder (GIAS publishes in this encoding). */
export function decode1252(bytes: Uint8Array): string {
  let s = "";
  const step = 8192;
  for (let i = 0; i < bytes.length; i += step) {
    const part = bytes.subarray(i, i + step);
    const codes = new Array<number>(part.length);
    for (let j = 0; j < part.length; j++) { const b = part[j]!; codes[j] = b >= 0x80 && b <= 0x9f ? (CP1252[b] ?? b) : b; }
    s += String.fromCharCode(...codes);
  }
  return s;
}

// ---------- GIAS ----------

export interface SchoolRow {
  id: string; kind: "school"; nation: string; name: string; phase: string | null; type: string | null; type_group: string | null;
  la: string | null; region: string | null; town: string | null; postcode: string | null; website: string | null;
  low_age: number | null; high_age: number | null; pupils: number | null; capacity: number | null; fsm_pct: number | null;
  gender: string | null; religious: string | null; admissions: string | null; trust: string | null; census_date: string | null;
  ofsted: OfstedRecord | null; ks4: Ks4Record | null; provider: null; search: string; source_date: string;
}

export function websiteUrl(raw: string | null): string | null {
  const s = cleanText(raw);
  if (!s) return null;
  const u = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try { const p = new URL(u); return p.hostname.includes(".") ? p.toString() : null; } catch { return null; }
}

/** Maps one GIAS row (keyed by header) to a school; null when not an open school in England. */
export function mapGias(r: Record<string, string>, sourceDate: string): SchoolRow | null {
  if (r["EstablishmentStatus (name)"] !== "Open" && r["EstablishmentStatus (name)"] !== "Open, but proposed to close") return null;
  const urn = cleanText(r["URN"]);
  const name = cleanText(r["EstablishmentName"]);
  if (!urn || !name) return null;
  const nation = cleanText(r["Country (name)"]) ?? "England";
  const town = cleanText(r["Town"]);
  const postcode = cleanText(r["Postcode"]);
  const la = cleanText(r["LA (name)"]);
  const trust = cleanText(r["Trusts (name)"]);
  return {
    id: `urn:${urn}`, kind: "school", nation, name,
    phase: cleanText(r["PhaseOfEducation (name)"]), type: cleanText(r["TypeOfEstablishment (name)"]), type_group: cleanText(r["EstablishmentTypeGroup (name)"]),
    la, region: cleanText(r["GOR (name)"]), town, postcode, website: websiteUrl(r["SchoolWebsite"] ?? null),
    low_age: cleanNumber(r["StatutoryLowAge"]), high_age: cleanNumber(r["StatutoryHighAge"]),
    pupils: cleanNumber(r["NumberOfPupils"]), capacity: cleanNumber(r["SchoolCapacity"]), fsm_pct: cleanNumber(r["PercentageFSM"]),
    gender: cleanText(r["Gender (name)"]), religious: cleanText(r["ReligiousCharacter (name)"]), admissions: cleanText(r["AdmissionsPolicy (name)"]),
    trust, census_date: ukDate(r["CensusDate"]), ofsted: null, ks4: null, provider: null,
    search: [name, town, postcode, postcode?.replace(/\s/g, ""), la, trust, urn].filter(Boolean).join(" ").toLowerCase(),
    source_date: sourceDate,
  };
}

// ---------- Ofsted ----------

export interface OfstedRecord {
  asAt: string;               // the management-information snapshot date
  link: string | null;        // Ofsted report page
  framework: "report card" | "graded" | "ungraded" | null;
  inspected: string | null;   // inspection start date
  published: string | null;
  inspectionType: string | null;
  grades: { area: string; grade: string }[];
  headline: string | null;    // Ofsted's own words for the latest outcome
  categoryOfConcern: string | null;
}

const REPORT_CARD_AREAS = ["Safeguarding standards", "Inclusion", "Curriculum and teaching", "Achievement", "Attendance and behaviour", "Personal development and wellbeing", "Early years (where applicable)", "Post-16 provision (where applicable)", "Leadership and governance"];
const OEIF_AREAS: [string, string][] = [
  ["Latest OEIF overall effectiveness", "Overall effectiveness"], ["Latest OEIF quality of education", "Quality of education"], ["Latest OEIF behaviour and attitudes", "Behaviour and attitudes"],
  ["Latest OEIF personal development", "Personal development"], ["Latest OEIF effectiveness of leadership and management", "Leadership and management"],
  ["Latest OEIF  safeguarding is effective?", "Safeguarding is effective?"], ["Latest OEIF early years provision (where applicable)", "Early years provision"], ["Latest OEIF sixth form provision (where applicable)", "Sixth form provision"],
];
/** Ofsted's published key for the 1–4 codes in its graded-inspection columns. */
export const OEIF_GRADE: Record<string, string> = { "1": "Outstanding", "2": "Good", "3": "Requires improvement", "4": "Inadequate" };

export function mapOfsted(r: Record<string, string>, asAt: string): { urn: string; rec: OfstedRecord } | null {
  const urn = cleanText(r["URN"]);
  if (!urn) return null;
  const link = cleanText(r["Web Link"])?.replace(/^http:/, "https:") ?? null;
  const cards = REPORT_CARD_AREAS.map((a) => ({ area: a.replace(/ \(where applicable\)$/, ""), grade: cleanText(r[a]) })).filter((g): g is { area: string; grade: string } => !!g.grade);
  const concern = cleanText(r["Most recent category of concern"]);
  if (cards.length) {
    return { urn, rec: { asAt, link, framework: "report card", inspected: ukDate(r["Inspection start date"]), published: ukDate(r["Publication date"]), inspectionType: cleanText(r["Inspection type"]), grades: cards, headline: null, categoryOfConcern: concern } };
  }
  const graded = OEIF_AREAS.map(([k, area]) => { const v = cleanText(r[k]); return v ? { area, grade: OEIF_GRADE[v] ?? v } : null; }).filter((g): g is { area: string; grade: string } => !!g);
  const gradedDate = ukDate(r["Inspection start date of latest OEIF graded inspection"]);
  const ungradedDate = ukDate(r["Date of latest ungraded inspection"]);
  const ungraded = cleanText(r["Ungraded inspection overall outcome"]);
  if (ungraded && ungradedDate && (!gradedDate || ungradedDate > gradedDate)) {
    return { urn, rec: { asAt, link, framework: "ungraded", inspected: ungradedDate, published: ukDate(r["Ungraded inspection publication date"]), inspectionType: "Ungraded inspection", grades: graded, headline: ungraded, categoryOfConcern: concern } };
  }
  if (graded.length) {
    const overall = graded.find((g) => g.area === "Overall effectiveness")?.grade ?? null;
    return { urn, rec: { asAt, link, framework: "graded", inspected: gradedDate, published: ukDate(r["Publication date of latest OEIF graded inspection"]), inspectionType: cleanText(r["Inspection type of latest OEIF graded inspection"]), grades: graded, headline: overall, categoryOfConcern: concern } };
  }
  return { urn, rec: { asAt, link, framework: null, inspected: null, published: null, inspectionType: null, grades: [], headline: null, categoryOfConcern: concern } };
}

/** Counts of Ofsted's own outcome words, by framework — never merged across frameworks. */
export function summariseOfsted(recs: OfstedRecord[]) {
  const reportCard: Record<string, Record<string, number>> = {};
  const graded: Record<string, number> = {};
  let reportCardSchools = 0, gradedSchools = 0, ungradedSchools = 0, none = 0;
  for (const r of recs) {
    if (r.framework === "report card") {
      reportCardSchools++;
      for (const g of r.grades) { (reportCard[g.area] ??= {})[g.grade] = (reportCard[g.area]![g.grade] ?? 0) + 1; }
    } else if (r.framework === "graded") {
      gradedSchools++;
      const o = r.headline;
      if (o) graded[o] = (graded[o] ?? 0) + 1;
    } else if (r.framework === "ungraded") ungradedSchools++;
    else none++;
  }
  return { total: recs.length, reportCardSchools, gradedSchools, ungradedSchools, none, reportCard, graded };
}
export type OfstedSummary = ReturnType<typeof summariseOfsted>;

// ---------- Explore Education Statistics ----------

export interface EesMeta {
  filters: { id: string; label: string; options: { id: string; label: string }[] }[];
  indicators: { id: string; label: string; unit?: string | null }[];
  locations: { level: { code: string; label: string }; options: { id: string; label: string; urn?: string }[] }[];
  timePeriods: { code: string; period: string; label: string }[];
}

/** For each filter pick the override label, else the "Total"/"All pupils" option. */
export function pickFilterOptions(meta: EesMeta, overrides: Record<string, string> = {}): string[] | null {
  const ids: string[] = [];
  for (const f of meta.filters) {
    const want = overrides[f.label];
    const opt = want
      ? f.options.find((o) => o.label === want)
      : f.options.find((o) => o.label === "Total") ?? f.options.find((o) => o.label === "All pupils") ?? f.options.find((o) => /^(all|total)\b/i.test(o.label));
    if (!opt) return null;
    ids.push(opt.id);
  }
  return ids;
}

export function indicatorId(meta: EesMeta, label: string): string | null {
  return meta.indicators.find((i) => i.label === label)?.id ?? null;
}

export interface EesHeadline { key: string; label: string; value: number | null; unit: string; period: string; dataset: string; publication: string; url: string; }

export function latestPeriod(meta: EesMeta) {
  return meta.timePeriods[meta.timePeriods.length - 1] ?? null;
}

// ---------- KS4 performance ----------

export const KS4_INDICATORS = [
  ["attainment8", "Average Attainment 8 score"],
  ["progress8", "Average Progress 8 score"],
  ["grade5EM", "Percentage of pupils achieving grades 5 or above in English and maths GCSEs"],
  ["grade4EM", "Percentage of pupils achieving grades 4 or above in English and maths GCSEs"],
  ["pupils", "Number of pupils at the end of KS4"],
] as const;
export type Ks4Key = (typeof KS4_INDICATORS)[number][0];
export interface Ks4Record { period: string; values: Record<Ks4Key, number | null>; }

// ---------- XLSX (OfS register) ----------

/** Reads shared strings + one worksheet XML into rows of strings. */
export function parseSheetXml(sheetXml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  for (const rm of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cm of rm[1]!.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1]!;
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? "";
      let col = 0;
      for (const ch of ref) col = col * 26 + (ch.charCodeAt(0) - 64);
      const t = /t="(\w+)"/.exec(attrs)?.[1];
      const body = cm[2] ?? "";
      let v = "";
      if (t === "s") v = shared[Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1])] ?? "";
      else if (t === "inlineStr") v = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1]!)).join("");
      else v = decode(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
      row[col - 1] = v;
    }
    rows.push(Array.from(row, (x) => x ?? ""));
  }
  return rows;
}

export function parseSharedStrings(xml: string): string[] {
  const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decode(t[1]!)).join(""));
}

export interface ProviderInfo {
  legalName: string; trading: string[]; category: string | null; tef: string | null; degreePowers: string | null;
  universityTitle: string | null; feeLimit: string | null; charity: string | null; penalties: { amount: number | null; reason: string; link: string | null }[];
}

/** Maps the OfS "Register" sheet (header row found by its first cell) to providers. */
export function mapOfsRegister(rows: string[][], penalties: string[][], sourceDate: string) {
  const hi = rows.findIndex((r) => (r[0] ?? "").startsWith("Provider’s legal name") || (r[0] ?? "").startsWith("Provider's legal name"));
  if (hi < 0) return [];
  const H = rows[hi]!.map((h) => h.replace(/\s+/g, " ").trim());
  const col = (start: string) => H.findIndex((h) => h.toLowerCase().startsWith(start.toLowerCase()));
  const c = { name: col("Provider’s legal name"), trading: col("Provider’s trading name"), ukprn: col("Provider’s UKPRN"), addr: col("Provider’s contact address"), web: col("Provider's website"), charity: col("Is the provider an exempt"), cat: col("Category in which"), fee: col("Fee limits"), tef: col("Current TEF Rating"), dap: col("Highest level of degree"), uni: col("Does the provider have the right to use") };
  const ph = penalties.findIndex((r) => (r[0] ?? "").startsWith("Provider’s legal name"));
  const pen = new Map<string, ProviderInfo["penalties"]>();
  if (ph >= 0) for (const r of penalties.slice(ph + 1)) {
    const id = String(r[2] ?? "").trim();
    if (!id) continue;
    const list = pen.get(id) ?? [];
    list.push({ amount: cleanNumber(r[3]), reason: (r[4] ?? "").replace(/\s+/g, " ").trim(), link: cleanText(r[5]) });
    pen.set(id, list);
  }
  const out: ProviderRow[] = [];
  for (const r of rows.slice(hi + 1)) {
    const ukprn = String(r[c.ukprn] ?? "").trim().replace(/\.0$/, "");
    const legal = cleanText(r[c.name]);
    if (!/^\d{8}$/.test(ukprn) || !legal) continue;
    const trading = (r[c.trading] ?? "").split(/\n/).map((s) => s.trim()).filter((s) => s && s !== "Not applicable");
    const addr = (r[c.addr] ?? "").split(/\n/).map((s) => s.trim()).filter(Boolean);
    const postcode = addr.find((l) => /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(l)) ?? null;
    const tefRaw = cleanText(r[c.tef]);
    const name = trading[0] && trading.length === 1 && trading[0].length < legal.length + 20 ? trading[0] : legal;
    out.push({
      id: `ukprn:${ukprn}`, kind: "provider", nation: "England", name, phase: "Higher education", type: cleanText(r[c.cat]), type_group: "Registered higher education provider",
      la: null, region: null, town: addr.length >= 2 ? addr[addr.length - (postcode ? 3 : 2)] ?? null : null, postcode, website: websiteUrl(r[c.web] ?? null),
      low_age: null, high_age: null, pupils: null, capacity: null, fsm_pct: null, gender: null, religious: null, admissions: null, trust: null, census_date: null,
      ofsted: null, ks4: null,
      provider: { legalName: legal, trading, category: cleanText(r[c.cat]), tef: tefRaw && /^https?:/i.test(tefRaw) ? "Rated — see TEF 2023 outcomes" : tefRaw, degreePowers: cleanText(r[c.dap]), universityTitle: cleanText(r[c.uni]), feeLimit: cleanText(r[c.fee]), charity: cleanText(r[c.charity]), penalties: pen.get(ukprn) ?? [] },
      search: [legal, ...trading, postcode, ukprn].filter(Boolean).join(" ").toLowerCase(), source_date: sourceDate,
    });
  }
  return out;
}
export type ProviderRow = Omit<SchoolRow, "kind" | "provider"> & { kind: "provider"; provider: ProviderInfo };

// ---------- search helpers ----------

/** Escapes LIKE wildcards and trims a free-text search. */
export function searchPattern(q: string): string | null {
  const s = q.toLowerCase().replace(/[%_\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return s.length >= 2 ? `%${s}%` : null;
}

export const PHASES = ["Primary", "Secondary", "All-through", "Nursery", "16 plus", "Middle deemed primary", "Middle deemed secondary", "Not applicable"] as const;
