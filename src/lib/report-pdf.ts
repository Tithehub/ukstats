// Builds the branded UKStats PDF report from saved official payloads.
// Every value printed is copied verbatim from a publisher payload; a missing
// figure prints "Not published". Nothing here estimates, rounds or fills gaps.
import { headlinesByCountry, travelRows, ukHeadlines, ukWarningMetrics } from "@/lib/report-extras";
import type { ReportItem, ReportsPayload } from "@/lib/news-reports";
import type { UnrestPayload } from "@/lib/unrest";
import { PREPAREDNESS_SUPPLIERS, SUPPLIER_LINK_POLICY, SUPPLIER_LINKS_CHECKED } from "@/lib/preparedness-suppliers";
import { PDFDocument, PDFString, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import qrcode from "qrcode-generator";
import type { Metric } from "@/lib/uk-stats";
import { CATEGORIES } from "@/lib/uk-stats";
import { fmtWorld, rankIndicator, WORLD_INDICATORS, WORLD_SOURCE, type WorldPayload } from "@/lib/world";
import { windowStart, type ReportEdition, type ReportKind } from "@/lib/reports";

export interface ReportFonts { regular: Uint8Array; bold: Uint8Array; black: Uint8Array; mono: Uint8Array; monoBold: Uint8Array; ukMap?: Uint8Array; globe?: Uint8Array }
export interface ReportInput {
  edition: ReportEdition;
  kind: ReportKind;
  date: string; // London date YYYY-MM-DD
  metrics: Metric[];
  ukSavedAt: string | null;
  world: WorldPayload | null;
  travel?: Pick<UnrestPayload, "warnings" | "fcdoAlerts"> | null;
  headlines?: Pick<ReportsPayload, "items"> | null;
  fonts: ReportFonts;
}

const W = 595.28, H = 841.89, M = 40;
const NAVY = rgb(5 / 255, 29 / 255, 63 / 255);
const NAVY2 = rgb(14 / 255, 46 / 255, 92 / 255);
const BLUE = rgb(0.02, 0.42, 1);
const INK = rgb(0.07, 0.09, 0.13);
const MUTED = rgb(0.38, 0.42, 0.48);
const LINE = rgb(0.86, 0.88, 0.91);
const PALE = rgb(0.95, 0.96, 0.98);
const WHITE = rgb(1, 1, 1);
const RED = rgb(0.82, 0.1, 0.12);
const YELLOW = rgb(1, 0.8, 0.1);

const HEADLINE_IDS = ["uk-national-debt", "uk-small-boats-week", "uk-irregular-migration", "uk-cpi", "uk-unemployment", "uk-threat-level", "uk-metoffice-warnings", "uk-flood-warnings"];
const TOP5 = ["NY.GDP.PCAP.CD", "FP.CPI.TOTL.ZG", "SL.UEM.TOTL.ZS", "GC.DOD.TOTL.GD.ZS", "SP.POP.TOTL"];

export function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
const shortDate = (iso: string | null | undefined) => (iso ? longDate(iso) : "—");

export async function buildReportPdf(input: ReportInput): Promise<{ bytes: Uint8Array; pages: number }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const F = {
    r: await doc.embedFont(input.fonts.regular, { subset: true }),
    b: await doc.embedFont(input.fonts.bold, { subset: true }),
    k: await doc.embedFont(input.fonts.black, { subset: true }),
    m: await doc.embedFont(input.fonts.mono, { subset: true }),
    mb: await doc.embedFont(input.fonts.monoBold, { subset: true }),
  };
  const charsets = new Map<PDFFont, Set<number>>();
  const safe = (f: PDFFont, s: string) => {
    let set = charsets.get(f);
    if (!set) { set = new Set(f.getCharacterSet()); charsets.set(f, set); }
    const map: Record<string, string> = { "₂": "2", "–": "-", "—": "-", "’": "'", "‘": "'", "“": '"', "”": '"', "…": "...", "·": "|", "≈": "~" };
    return Array.from(s.replace(/\s+/g, " ")).map((c) => (set!.has(c.codePointAt(0)!) ? c : map[c] && set!.has(map[c]!.codePointAt(0)!) ? map[c] : map[c] ?? "")).join("");
  };
  const width = (f: PDFFont, s: string, size: number) => f.widthOfTextAtSize(safe(f, s), size);
  const wrap = (f: PDFFont, s: string, size: number, max: number): string[] => {
    const words = safe(f, s).split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) <= max || !cur) cur = next;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    // Hard-break any single word still wider than the column.
    return lines.flatMap((l) => {
      if (f.widthOfTextAtSize(l, size) <= max) return [l];
      const out: string[] = []; let c = "";
      for (const ch of l) { if (f.widthOfTextAtSize(c + ch, size) > max && c) { out.push(c); c = ch; } else c += ch; }
      return c ? [...out, c] : out;
    });
  };
  const text = (p: PDFPage, s: string, x: number, y: number, f: PDFFont, size: number, color = INK) =>
    p.drawText(safe(f, s), { x, y, size, font: f, color });
  const fit = (f: PDFFont, s: string, size: number, max: number) => {
    let t = safe(f, s);
    if (f.widthOfTextAtSize(t, size) <= max) return t;
    while (t.length > 1 && f.widthOfTextAtSize(`${t}...`, size) > max) t = t.slice(0, -1);
    return `${t.trimEnd()}...`;
  };

  const editionName = input.edition === "uk" ? "UK" : "Global";
  const kindName = input.kind === "daily" ? "Daily" : input.kind === "weekly" ? "Weekly" : "Monthly";
  const title = `${kindName} ${editionName} Report`;
  const dateLong = longDate(input.date);

  const logo = (p: PDFPage, x: number, y: number, s: number, light: boolean) => {
    // UKStats bar mark drawn as vectors so it stays sharp at any size.
    const bars = [[0.18, 0.34, 0.5], [0.42, 0.58, 0.64], [0.66, 0.82, 0.78]];
    bars.forEach(([a, b, h], i) => p.drawRectangle({ x: x + a! * s, y, width: (b! - a!) * s, height: h! * s, color: i === 2 ? BLUE : light ? WHITE : NAVY }));
  };

  // ---------- Cover (drawn last, see drawCover) ----------
  const cover = doc.addPage([W, H]);
  const toc: { section: string; page: number }[] = [];

  // ---------- Page furniture ----------
  const pages: PDFPage[] = [];
  const newPage = (section: string) => {
    const p = doc.addPage([W, H]);
    pages.push(p);
    if (!toc.some((t) => t.section === section)) toc.push({ section, page: pages.length + 1 });
    p.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: NAVY });
    logo(p, M, H - 26, 18, true);
    text(p, "UKSTATS", M + 22, H - 23, F.k, 11, WHITE);
    text(p, fit(F.mb, `${title.toUpperCase()}  |  ${dateLong.toUpperCase()}`, 7.5, 300), W - M - width(F.mb, fit(F.mb, `${title.toUpperCase()}  |  ${dateLong.toUpperCase()}`, 7.5, 300), 7.5), H - 21, F.mb, 7.5, rgb(0.75, 0.82, 0.92));
    text(p, section.toUpperCase(), M, H - 62, F.mb, 8, BLUE);
    return p;
  };
  const sectionTitle = (p: PDFPage, s: string, y: number) => {
    text(p, s, M, y, F.k, 22, NAVY);
    p.drawRectangle({ x: M, y: y - 9, width: 40, height: 3, color: RED });
    return y - 30;
  };

  // ---------- Headlines ----------
  const byId = new Map(input.metrics.map((m) => [m.id, m]));
  let p = newPage("At a glance");
  let y = sectionTitle(p, "The headline figures", H - 92);
  const cw = (W - 2 * M - 12) / 2, ch = 140;
  HEADLINE_IDS.forEach((id, i) => {
    const m = byId.get(id);
    const x = M + (i % 2) * (cw + 12), top = y - Math.floor(i / 2) * (ch + 10);
    const warn = id === "uk-metoffice-warnings" && m?.value ? (/red/i.test(m.value) ? RED : /amber|yellow/i.test(m.value) ? YELLOW : null) : null;
    p.drawRectangle({ x, y: top - ch, width: cw, height: ch, color: PALE, borderColor: LINE, borderWidth: 0.6 });
    p.drawRectangle({ x, y: top - ch, width: 4, height: ch, color: warn ?? NAVY });
    text(p, fit(F.mb, (m?.category ?? "").toUpperCase(), 7, cw - 24), x + 14, top - 16, F.mb, 7, MUTED);
    wrap(F.b, m?.title ?? id, 10, cw - 28).slice(0, 2).forEach((l, j) => text(p, l, x + 14, top - 30 - j * 12, F.b, 10, INK));
    const v = m?.value ?? "Not published";
    text(p, fit(F.k, v, m?.value ? 24 : 16, cw - 28), x + 14, top - 72, F.k, m?.value ? 24 : 16, m?.value ? NAVY : MUTED);
    text(p, fit(F.m, m?.period ?? "Period not stated", 7.5, cw - 28), x + 14, top - 88, F.m, 7.5, INK);
    if (m?.yearAgo) text(p, fit(F.m, `Year earlier: ${m.yearAgo.value} (${m.yearAgo.period}), ${m.yearAgo.diff}`, 7, cw - 28), x + 14, top - 100, F.m, 7, BLUE);
    text(p, fit(F.m, m?.source ?? "Source", 6.5, cw - 28), x + 14, top - 114, F.m, 6.5, MUTED);
    text(p, fit(F.m, `Published ${shortDate(m?.asOf)}  |  next release ${m?.nextDue ? shortDate(m.nextDue) : "not announced"}`, 6.5, cw - 28), x + 14, top - 124, F.m, 6.5, MUTED);
  });

  // ---------- Metric tables ----------
  const cols = [{ w: 168, h: "Measure" }, { w: 92, h: "Figure" }, { w: 82, h: "Period" }, { w: 70, h: "Published" }, { w: 103, h: "Source  |  next release" }];
  const tableHeader = (pg: PDFPage, yy: number) => {
    pg.drawRectangle({ x: M, y: yy - 16, width: W - 2 * M, height: 16, color: NAVY });
    let x = M + 6;
    cols.forEach((c) => { text(pg, c.h.toUpperCase(), x, yy - 11, F.mb, 6.5, WHITE); x += c.w; });
    return yy - 16;
  };
  const table = (heading: string, rows: Metric[], label: string) => {
    if (!rows.length) return;
    if (y < 160) { p = newPage(label); y = H - 92; }
    else if (y < H - 120) y -= 34;
    y = sectionTitle(p, heading, y);
    y = tableHeader(p, y);
    rows.forEach((m, idx) => {
      const cells = [
        wrap(F.b, m.title, 8, cols[0]!.w - 10),
        wrap(F.k, m.value ?? (m.emptyLabel || "Not published"), m.value ? 9 : 8, cols[1]!.w - 10),
        wrap(F.r, m.period ?? "—", 7.5, cols[2]!.w - 10),
        wrap(F.m, shortDate(m.asOf), 7, cols[3]!.w - 8),
        [...wrap(F.m, m.source, 6.5, cols[4]!.w - 8), ...wrap(F.m, `Next: ${m.nextDue ? shortDate(m.nextDue) : "not announced"}`, 6.5, cols[4]!.w - 8)],
      ];
      const yoy = m.yearAgo ? wrap(F.m, `Year earlier: ${m.yearAgo.value} (${m.yearAgo.period}), ${m.yearAgo.diff}`, 6.5, cols[0]!.w - 10) : [];
      cells[0] = [...cells[0]!, ...yoy];
      const lines = Math.max(...cells.map((c) => c.length));
      const rh = Math.max(22, lines * 9.5 + 9);
      if (y - rh < 60) { p = newPage(label); y = tableHeader(p, H - 80); }
      if (idx % 2 === 0) p.drawRectangle({ x: M, y: y - rh, width: W - 2 * M, height: rh, color: PALE });
      let x = M + 6;
      cells.forEach((c, ci) => {
        const f = ci === 0 ? F.b : ci === 1 ? F.k : ci === 2 ? F.r : F.m;
        c.forEach((l, li) => {
          const isYoy = ci === 0 && li >= cells[0]!.length - yoy.length && yoy.length > 0;
          const isNext = ci === 4 && l.startsWith("Next:");
          text(p, l, x, y - 12 - li * 9.5, isYoy ? F.m : f, isYoy || ci === 4 ? 6.5 : ci === 1 ? (m.value ? 9 : 8) : ci === 3 ? 7 : ci === 2 ? 7.5 : 8,
            ci === 1 && !m.value ? MUTED : isYoy ? BLUE : isNext ? MUTED : INK);
        });
        x += cols[ci]!.w;
      });
      p.drawLine({ start: { x: M, y: y - rh }, end: { x: W - M, y: y - rh }, thickness: 0.4, color: LINE });
      y -= rh;
    });
  };

  // ---------- Warnings, supply kits, headlines ----------
  const link = (pg: PDFPage, x: number, yy: number, w: number, h: number, url: string) => {
    const a = doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [x, yy, x + w, yy + h], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(url) } });
    pg.node.addAnnot(doc.context.register(a));
  };
  const para = (s: string, f = F.r, size = 9, color = INK, indent = 0) => {
    for (const l of wrap(f, s, size, W - 2 * M - indent)) {
      if (y < 60) { p = newPage(curLabel); y = H - 92; }
      text(p, l, M + indent, y, f, size, color); y -= size + 4;
    }
  };
  const urlLine = (url: string, indent = 0) => {
    const t = fit(F.m, url, 7, W - 2 * M - indent);
    if (y < 60) { p = newPage(curLabel); y = H - 92; }
    text(p, t, M + indent, y, F.m, 7, BLUE); link(p, M + indent, y - 2, width(F.m, t, 7), 10, url); y -= 12;
  };
  const need = (h: number) => { if (y - h < 60) { p = newPage(curLabel); y = H - 92; } };
  let curLabel = "Government warnings";
  p = newPage(curLabel); y = sectionTitle(p, "UK Government warnings", H - 92);
  const warns = ukWarningMetrics(input.metrics);
  if (!warns.length) para("Not published at time of report.", F.r, 10, MUTED);
  for (const m of warns) {
    need(46);
    p.drawRectangle({ x: M, y: y - 4, width: 3, height: 14, color: m.value && /red|severe|critical/i.test(m.value) ? RED : m.value && /amber|yellow|substantial/i.test(m.value) ? YELLOW : NAVY });
    text(p, fit(F.b, m.title, 10, 300), M + 10, y, F.b, 10, INK);
    const v = m.value ?? "Not published at time of report";
    text(p, fit(F.k, v, 10, 200), W - M - width(F.k, fit(F.k, v, 10, 200), 10), y, F.k, 10, m.value ? NAVY : MUTED);
    y -= 13;
    para(`${m.source}  |  issued ${shortDate(m.asOf)}${m.period ? `  |  ${m.period}` : ""}`, F.m, 7, MUTED, 10);
    if (m.sourceUrl) urlLine(m.sourceUrl, 10);
    y -= 6;
  }
  y -= 10; need(80);
  y = sectionTitle(p, "Emergency supply kits", y);
  para("Official advice first: the UK Government's Be Ready guidance explains what to keep at home for an emergency.", F.r, 9);
  urlLine("https://beready.campaign.gov.uk/");
  y -= 4;
  para("UKStats makes no money from these links. They are not affiliate links or paid placements, and UKStats does not endorse or test any product. You buy directly from the supplier.", F.b, 8.5, RED);
  para(`Supplier pages checked ${shortDate(SUPPLIER_LINKS_CHECKED)}.`, F.m, 7, MUTED);
  y -= 4;
  for (const s of PREPAREDNESS_SUPPLIERS) {
    need(40);
    para(`${s.supplier}: ${s.name} (${s.category})`, F.b, 8.5);
    urlLine(s.url, 8);
    para(s.limitations, F.r, 7.5, MUTED, 8);
    y -= 4;
  }
  void SUPPLIER_LINK_POLICY;
  const news = input.headlines?.items ?? [];
  const headBlock = (items: ReportItem[]) => {
    for (const h of items) {
      need(30);
      text(p, h.official ? "POLICE NOTICE" : "NEWS", M, y, F.mb, 6.5, h.official ? BLUE : RED); y -= 10;
      para(h.title, F.b, 8.5, INK);
      para(`${h.publisher}  |  ${h.published ? shortDate(h.published) : "time not stated"}`, F.m, 6.5, MUTED);
      if (h.link) urlLine(h.link);
      y -= 3;
    }
  };
  const uk = ukHeadlines(news);
  if (uk.length) {
    curLabel = "Main headlines"; p = newPage(curLabel); y = sectionTitle(p, "Main UK headlines", H - 92);
    para("Headlines copied word for word from the publisher. They are news, not official figures.", F.r, 8.5, MUTED); y -= 4;
    headBlock(uk);
  }

  if (input.edition === "global" && input.travel) {
    curLabel = "Travel warnings"; p = newPage(curLabel); y = sectionTitle(p, "Government travel warnings, every country", H - 92);
    para("Each government's own wording, side by side and never merged: UK FCDO and US State Department. * = the publisher mentioned riots, protests or unrest in the last 30 days.", F.r, 8.5, MUTED); y -= 4;
    const rows = travelRows(input.travel.warnings, input.travel.fcdoAlerts, new Date(`${input.date}T12:00:00Z`));
    const cx = [M + 6, M + 140, M + 330];
    const hdr = () => { p.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 16, color: NAVY }); ["COUNTRY", "UK FCDO", "US STATE DEPT"].forEach((h, i) => text(p, h, cx[i]!, y - 11, F.mb, 6.5, WHITE)); y -= 16; };
    hdr();
    rows.forEach((r, i) => {
      if (y - 14 < 60) { p = newPage(curLabel); y = H - 80; hdr(); }
      if (i % 2 === 0) p.drawRectangle({ x: M, y: y - 14, width: W - 2 * M, height: 14, color: PALE });
      text(p, fit(F.b, `${r.unrest ? "* " : ""}${r.country}`, 7.5, 128), cx[0]!, y - 10, F.b, 7.5, r.unrest ? RED : INK);
      const uk = fit(F.r, r.uk, 7, 184), us = fit(F.r, r.us, 7, W - M - cx[2]! - 6);
      text(p, uk, cx[1]!, y - 10, F.r, 7, r.uk === "Not checked" ? MUTED : INK);
      text(p, us, cx[2]!, y - 10, F.r, 7, r.us === "Not checked" ? MUTED : INK);
      if (r.ukUrl) link(p, cx[1]!, y - 13, 184, 12, r.ukUrl);
      if (r.usUrl) link(p, cx[2]!, y - 13, W - M - cx[2]!, 12, r.usUrl);
      y -= 14;
    });
    if (!rows.length) para("Not published at time of report.", F.r, 10, MUTED);
    const names = input.world?.countries.map((c) => c.name) ?? [...new Set(rows.map((r) => r.country))];
    const per = headlinesByCountry(news, names.filter((n) => n !== "United Kingdom"));
    if (per.length) {
      curLabel = "World headlines"; p = newPage(curLabel); y = sectionTitle(p, "Main headlines by country", H - 92);
      para("Headlines copied word for word from the publisher. They are news, not official figures.", F.r, 8.5, MUTED); y -= 4;
      for (const c of per) { need(50); text(p, c.country, M, y, F.k, 11, NAVY); y -= 15; headBlock(c.items); y -= 4; }
    }
  }

  p = newPage("Official register"); y = H - 92;
  if (input.kind !== "daily") {
    const from = windowStart(input.date, input.kind);
    const fresh = input.metrics.filter((m) => m.asOf && m.asOf.slice(0, 10) >= from && m.asOf.slice(0, 10) <= input.date);
    table(`Published this ${input.kind === "weekly" ? "week" : "month"}`, fresh, "New releases");
    if (!fresh.length) { text(p, `No figure in the register was published between ${longDate(from)} and ${dateLong}.`, M, y, F.r, 10, MUTED); y -= 30; }
  }
  for (const cat of CATEGORIES) table(cat, input.metrics.filter((m) => m.category === cat), cat);
  const other = input.metrics.filter((m) => !CATEGORIES.includes(m.category));
  table("Other measures", other, "Other measures");

  // ---------- Global ----------
  if (input.edition === "global") {
    const wp = input.world;
    p = newPage("World"); y = sectionTitle(p, "World rankings", H - 92);
    if (!wp) {
      text(p, "World Bank figures were not available when this report was compiled. Not published.", M, y, F.r, 10, MUTED);
    } else {
      wrap(F.r, `Top ten countries for each headline measure, from ${WORLD_SOURCE.name}. Figures more than three years behind the newest filing are not ranked.`, 9, W - 2 * M).forEach((l) => { text(p, l, M, y, F.r, 9, MUTED); y -= 13; });
      y -= 6;
      const inds = TOP5.map((id) => WORLD_INDICATORS.find((i) => i.id === id)!).filter(Boolean);
      const boxW = (W - 2 * M - 12) / 2;
      inds.forEach((ind, i) => {
        const rows = rankIndicator(wp, ind).filter((r) => r.rank != null).slice(0, 10);
        const bh = 34 + 10 * 13;
        const col = i % 2, x = M + col * (boxW + 12);
        if (col === 0 && i > 0) y -= bh + 12;
        if (y - bh < 60) { p = newPage("World"); y = H - 92; }
        p.drawRectangle({ x, y: y - bh, width: boxW, height: bh, color: PALE, borderColor: LINE, borderWidth: 0.6 });
        text(p, fit(F.b, ind.label, 10, boxW - 20), x + 10, y - 16, F.b, 10, NAVY);
        rows.forEach((r, j) => {
          const yy = y - 32 - j * 13;
          text(p, String(r.rank).padStart(2, " "), x + 10, yy, F.mb, 7.5, BLUE);
          text(p, fit(F.r, r.country.name, 8, boxW - 120), x + 28, yy, F.r, 8, INK);
          const v = `${fmtWorld(r.value, ind.unit)} (${r.year})`;
          text(p, v, x + boxW - 10 - width(F.m, v, 7.5), yy, F.m, 7.5, INK);
        });
      });
      // Country directory
      p = newPage("Country by country"); y = sectionTitle(p, "Five main figures, every country", H - 92);
      const dc = [{ w: 135, h: "Country" }, ...inds.map((i) => ({ w: (W - 2 * M - 135) / inds.length, h: i.label.replace(/ \(.*\)/, "") }))];
      const head = (pg: PDFPage, yy: number) => {
        pg.drawRectangle({ x: M, y: yy - 18, width: W - 2 * M, height: 18, color: NAVY });
        let x = M + 6; dc.forEach((c) => { text(pg, fit(F.mb, c.h.toUpperCase(), 6, c.w - 6), x, yy - 12, F.mb, 6, WHITE); x += c.w; });
        return yy - 18;
      };
      y = head(p, y);
      [...wp.countries].sort((a, b) => a.name.localeCompare(b.name)).forEach((c, idx) => {
        if (y - 15 < 60) { p = newPage("Country by country"); y = head(p, H - 80); }
        if (idx % 2 === 0) p.drawRectangle({ x: M, y: y - 15, width: W - 2 * M, height: 15, color: PALE });
        let x = M + 6;
        text(p, fit(F.b, c.name, 7.5, dc[0]!.w - 8), x, y - 10.5, F.b, 7.5, INK); x += dc[0]!.w;
        inds.forEach((ind, k) => {
          const v = wp.values[ind.id]?.[c.iso3];
          text(p, v ? `${fmtWorld(v.value, ind.unit)} '${String(v.year).slice(2)}` : "Not published", x, y - 10.5, F.m, 7, v ? INK : MUTED);
          x += dc[k + 1]!.w;
        });
        y -= 15;
      });
    }
  }

  // ---------- Sources ----------
  p = newPage("Sources"); y = sectionTitle(p, "Sources and method", H - 92);
  const method = [
    "UKStats copies each figure exactly as the official publisher released it. Nothing is estimated, interpolated, rounded or re-based.",
    "Where a publisher has not released a figure, or has no machine-readable feed, this report prints \"Not published\" instead of a number.",
    "Year-on-year comparisons appear only where the same publisher series gives the same period one year earlier.",
    "Weather and terrorism warnings are the issuing body's own levels. News headlines are copied word for word, labelled as news or police notices, and never used as figures.",
  ];
  method.forEach((s) => { wrap(F.r, s, 9, W - 2 * M - 14).forEach((l, i) => { if (i === 0) p.drawCircle({ x: M + 3, y: y + 3, size: 1.6, color: RED }); text(p, l, M + 12, y, F.r, 9, INK); y -= 13; }); y -= 4; });
  y -= 10;
  const sources = new Map<string, string>();
  input.metrics.forEach((m) => { if (!sources.has(m.source)) sources.set(m.source, m.sourceUrl); });
  if (input.edition === "global") sources.set(WORLD_SOURCE.name, WORLD_SOURCE.url);
  for (const [name, url] of [...sources].sort((a, b) => a[0].localeCompare(b[0]))) {
    const nl = wrap(F.b, name, 8.5, 200), ul = wrap(F.m, url, 7, W - 2 * M - 220);
    const rh = Math.max(nl.length * 11, ul.length * 9) + 6;
    if (y - rh < 60) { p = newPage("Sources"); y = H - 92; }
    nl.forEach((l, i) => text(p, l, M, y - i * 11, F.b, 8.5, INK));
    ul.forEach((l, i) => text(p, l, M + 220, y - i * 9, F.m, 7, BLUE));
    y -= rh;
    p.drawLine({ start: { x: M, y: y + 3 }, end: { x: W - M, y: y + 3 }, thickness: 0.3, color: LINE });
  }

  async function drawCover() {
    const SOFT = rgb(0.62, 0.71, 0.84), FAINT = rgb(0.85, 0.89, 0.95);
    const c = cover;
    c.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
    c.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: RED });
    const L = 56;
    // Masthead
    logo(c, L, H - 70, 22, true);
    text(c, "UKSTATS", L + 26, H - 63, F.k, 13, WHITE);
    const [yy, mm, dd] = input.date.split("-").map(Number);
    const doy = Math.round((Date.UTC(yy!, mm! - 1, dd!) - Date.UTC(yy!, 0, 0)) / 864e5);
    const vol = `No. ${doy}  |  ${yy}`;
    text(c, vol, W - L - width(F.m, vol, 8), H - 61, F.m, 8, SOFT);
    // Artwork centrepiece
    const art = input.edition === "uk" ? input.fonts.ukMap : input.fonts.globe;
    if (art) {
      const img = await doc.embedPng(art);
      const bh = input.edition === "uk" ? 330 : 300, bw = (img.width / img.height) * bh;
      c.drawImage(img, { x: (W - bw) / 2, y: H - 120 - bh, width: bw, height: bh, opacity: 0.9 });
    }
    // Title
    const ty = 360;
    text(c, `${editionName} ${kindName} Report`, L, ty, F.r, 30, WHITE);
    const dLong = new Date(Date.UTC(yy!, mm! - 1, dd!)).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    text(c, dLong, L, ty - 24, F.r, 11, SOFT);
    c.drawRectangle({ x: L, y: ty - 42, width: 28, height: 1.5, color: RED });
    // Single headline figure
    const hm = input.metrics.find((m) => m.id === "uk-national-debt");
    text(c, fit(F.r, hm?.title ?? "UK public sector net debt", 9, W - 2 * L), L, ty - 82, F.r, 9, SOFT);
    const hv = hm?.value ?? "Not published";
    text(c, hv, L, ty - 112, F.r, 26, hm?.value ? WHITE : SOFT);
    const meta = `${hm?.source ?? "Source not available"}  |  ${hm?.period ?? "period not stated"}`;
    text(c, fit(F.m, meta, 7.5, W - 2 * L - width(F.r, hv, 26) - 20), L + width(F.r, hv, 26) + 16, ty - 108, F.m, 7.5, SOFT);
    // Quiet contents line
    const names = toc.filter((t) => !(CATEGORIES as readonly string[]).includes(t.section)).map((t) => t.section);
    text(c, "INSIDE", L, ty - 160, F.mb, 7, SOFT);
    wrap(F.r, names.join("   ·   "), 9, W - 2 * L - 50).slice(0, 2).forEach((l, i) => text(c, l, L + 46, ty - 160 - i * 14, F.r, 9, FAINT));
    // Footer
    c.drawLine({ start: { x: L, y: 96 }, end: { x: W - L, y: 96 }, thickness: 0.4, color: NAVY2 });
    text(c, "ukstats.co.uk", L, 70, F.b, 10, WHITE);
    text(c, "Official figures only  |  free forever online", L, 56, F.r, 8, SOFT);
    const qr = qrcode(0, "M");
    qr.addData("https://ukstats.co.uk/?utm_source=report&utm_medium=pdf");
    qr.make();
    const n = qr.getModuleCount(), qs = 46, cell = qs / n, qx = W - L - qs, qy = 48;
    c.drawRectangle({ x: qx - 4, y: qy - 4, width: qs + 8, height: qs + 8, color: WHITE });
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) c.drawRectangle({ x: qx + k * cell, y: qy + (n - 1 - r) * cell, width: cell + 0.15, height: cell + 0.15, color: NAVY });
    const cap = "Live figures";
    text(c, cap, qx - 12 - width(F.m, cap, 7), qy + 2, F.m, 7, SOFT);
  }

  // ---------- Footers ----------
  const total = pages.length + 1;
  pages.forEach((pg, i) => {
    pg.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: 0.5, color: LINE });
    text(pg, "UKStats  |  ukstats.co.uk  |  Official figures only, nothing estimated", M, 26, F.m, 7, MUTED);
    const pn = `Page ${i + 2} of ${total}`;
    text(pg, pn, W - M - width(F.mb, pn, 7), 26, F.mb, 7, NAVY);
  });
  await drawCover();

  doc.setTitle(`UKStats ${title} — ${dateLong}`);
  doc.setAuthor("UKStats");
  doc.setSubject("Official statistics, every figure sourced and dated");
  doc.setCreator("ukstats.co.uk");
  doc.setProducer("UKStats");
  return { bytes: await doc.save(), pages: total };
}
