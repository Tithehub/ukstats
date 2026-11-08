/** Tiny pure-JS rasteriser for share cards: rectangles + font glyphs → PNG. Runs on the edge (no native code). */
import fontkit from "@pdf-lib/fontkit";
import { zlibSync } from "fflate";
import regular from "@/assets/fonts/Archivo-Regular.ttf?inline";
import bold from "@/assets/fonts/Archivo-Bold.ttf?inline";
import black from "@/assets/fonts/Archivo-Black.ttf?inline";
import mono from "@/assets/fonts/IBMPlexMono-Regular.ttf?inline";
import type { OgCardText } from "@/lib/og-card";

type RGB = [number, number, number];
type Font = { unitsPerEm: number; layout: (t: string) => { glyphs: { path: { commands: { command: string; args: number[] }[] } }[]; positions: { xAdvance: number }[] } };

const W = 1200, H = 630;
const NAVY: RGB = [5, 29, 63], WHITE: RGB = [255, 255, 255], MUTED: RGB = [178, 192, 214], RED: RGB = [228, 0, 43], YELLOW: RGB = [255, 205, 0];

const bytes = (u: string) => { const b = atob(u.slice(u.indexOf(",") + 1)); const o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; };
let fonts: Record<"r" | "b" | "k" | "m", Font> | null = null;
const getFonts = () => (fonts ??= {
  r: fontkit.create(bytes(regular)) as unknown as Font,
  b: fontkit.create(bytes(bold)) as unknown as Font,
  k: fontkit.create(bytes(black)) as unknown as Font,
  m: fontkit.create(bytes(mono)) as unknown as Font,
});

class Canvas {
  px = new Uint8Array(W * H * 3);
  constructor(bg: RGB) { for (let i = 0; i < W * H; i++) this.px.set(bg, i * 3); }
  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = Math.max(0, Math.round(y)); j < Math.min(H, Math.round(y + h)); j++)
      for (let i = Math.max(0, Math.round(x)); i < Math.min(W, Math.round(x + w)); i++) this.px.set(c, (j * W + i) * 3);
  }
  blend(i: number, j: number, a: number, c: RGB) {
    if (a <= 0 || i < 0 || j < 0 || i >= W || j >= H) return;
    const k = (j * W + i) * 3; const t = Math.min(1, a);
    for (let n = 0; n < 3; n++) this.px[k + n] = Math.round(this.px[k + n]! * (1 - t) + c[n]! * t);
  }
}

export function measure(f: Font, text: string, size: number): number {
  const run = f.layout(text);
  return run.positions.reduce((s, p) => s + p.xAdvance, 0) * (size / f.unitsPerEm);
}

/** Fill glyph outlines (non-zero winding) with 4 sub-scanlines and exact horizontal coverage. */
function drawText(cv: Canvas, f: Font, text: string, x: number, baseline: number, size: number, c: RGB) {
  const s = size / f.unitsPerEm;
  const run = f.layout(text);
  const edges: [number, number, number, number][] = [];
  let pen = x;
  run.glyphs.forEach((g, gi) => {
    let cx = 0, cy = 0, sx = 0, sy = 0;
    const P = (px: number, py: number): [number, number] => [pen + px * s, baseline - py * s];
    const line = (x2: number, y2: number) => { const a = P(cx, cy), b = P(x2, y2); if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]); cx = x2; cy = y2; };
    for (const cmd of g.path.commands) {
      const a = cmd.args;
      if (cmd.command === "moveTo") { cx = sx = a[0]!; cy = sy = a[1]!; }
      else if (cmd.command === "lineTo") line(a[0]!, a[1]!);
      else if (cmd.command === "quadraticCurveTo") { const x0 = cx, y0 = cy; for (let t = 1; t <= 8; t++) { const u = t / 8, v = 1 - u; line(v * v * x0 + 2 * v * u * a[0]! + u * u * a[2]!, v * v * y0 + 2 * v * u * a[1]! + u * u * a[3]!); } }
      else if (cmd.command === "bezierCurveTo") { const x0 = cx, y0 = cy; for (let t = 1; t <= 10; t++) { const u = t / 10, v = 1 - u; line(v * v * v * x0 + 3 * v * v * u * a[0]! + 3 * v * u * u * a[2]! + u * u * u * a[4]!, v * v * v * y0 + 3 * v * v * u * a[1]! + 3 * v * u * u * a[3]! + u * u * u * a[5]!); } }
      else if (cmd.command === "closePath") { line(sx, sy); }
    }
    pen += run.positions[gi]!.xAdvance * s;
  });
  if (!edges.length) return;
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const e of edges) { y0 = Math.min(y0, e[1], e[3]); y1 = Math.max(y1, e[1], e[3]); x0 = Math.min(x0, e[0], e[2]); x1 = Math.max(x1, e[0], e[2]); }
  const left = Math.max(0, Math.floor(x0)), right = Math.min(W, Math.ceil(x1) + 1);
  const cov = new Float32Array(right - left + 1);
  const SUB = 4;
  for (let j = Math.max(0, Math.floor(y0)); j <= Math.min(H - 1, Math.ceil(y1)); j++) {
    cov.fill(0);
    for (let k = 0; k < SUB; k++) {
      const sy = j + (k + 0.5) / SUB;
      const xs: [number, number][] = [];
      for (const [ax, ay, bx, by] of edges) {
        if ((sy >= ay && sy < by) || (sy >= by && sy < ay)) xs.push([ax + ((sy - ay) / (by - ay)) * (bx - ax), by > ay ? 1 : -1]);
      }
      xs.sort((p, q) => p[0] - q[0]);
      let wind = 0;
      for (let n = 0; n < xs.length - 1; n++) {
        wind += xs[n]![1];
        if (wind === 0) continue;
        const a = xs[n]![0] - left, b = xs[n + 1]![0] - left;
        if (b <= a) continue;
        const ia = Math.floor(a), ib = Math.floor(b);
        if (ia === ib) { if (ia >= 0 && ia < cov.length) cov[ia]! += (b - a) / SUB; continue; }
        if (ia >= 0 && ia < cov.length) cov[ia]! += (ia + 1 - a) / SUB;
        for (let i = Math.max(0, ia + 1); i < Math.min(cov.length, ib); i++) cov[i]! += 1 / SUB;
        if (ib >= 0 && ib < cov.length) cov[ib]! += (b - ib) / SUB;
      }
    }
    for (let i = 0; i < cov.length; i++) if (cov[i]! > 0) cv.blend(left + i, j, cov[i]!, c);
  }
}

function wrap(f: Font, text: string, size: number, max: number, lines: number): string[] {
  const out: string[] = []; let cur = "";
  for (const w of text.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(f, next, size) <= max || !cur) cur = next; else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  if (out.length > lines) { const kept = out.slice(0, lines); let last = kept[lines - 1]!; while (last && measure(f, `${last}…`, size) > max) last = last.slice(0, -1); kept[lines - 1] = `${last.trimEnd()}…`; return kept; }
  return out;
}

function fit(f: Font, text: string, size: number, max: number, min: number): string {
  if (measure(f, text, min) <= max) return text;
  let t = text; while (t && measure(f, `${t}…`, min) > max) t = t.slice(0, -1);
  return `${t}…`;
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) { c ^= buf[i]!; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}

function png(cv: Canvas): Uint8Array {
  const raw = new Uint8Array((W * 3 + 1) * H);
  for (let j = 0; j < H; j++) { raw[j * (W * 3 + 1)] = 0; raw.set(cv.px.subarray(j * W * 3, (j + 1) * W * 3), j * (W * 3 + 1) + 1); }
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length); const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length); for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8); dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length))); return out;
  };
  const ihdr = new Uint8Array(13); const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W); dv.setUint32(4, H); ihdr[8] = 8; ihdr[9] = 2;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlibSync(raw, { level: 6 })), chunk("IEND", new Uint8Array())];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function chrome(cv: Canvas, f: ReturnType<typeof getFonts>, domain: string, brand: string) {
  cv.rect(0, 0, W, 10, RED);
  // Logo: three rising bars + bold "UK" + regular "Stats" (website lockup).
  cv.rect(60, 78, 12, 22, WHITE); cv.rect(78, 56, 12, 44, WHITE); cv.rect(96, 68, 12, 32, WHITE);
  if (brand === "UKStats") { drawText(cv, f.k, "UK", 122, 100, 40, WHITE); drawText(cv, f.r, "Stats", 122 + measure(f.k, "UK", 40) + 2, 100, 40, WHITE); }
  else drawText(cv, f.b, brand, 122, 100, 40, WHITE);
  drawText(cv, f.m, domain, W - 60 - measure(f.m, domain, 26), 96, 26, MUTED);
  cv.rect(0, H - 70, W, 70, [9, 40, 84]);
  drawText(cv, f.m, "Official figure · nothing estimated · free to use", 60, H - 26, 24, MUTED);
}

export function renderFigureCard(t: OgCardText, domain: string, brand: string): Uint8Array {
  const f = getFonts(); const cv = new Canvas(NAVY); chrome(cv, f, domain, brand);
  const titleLines = wrap(f.b, t.title, 46, W - 120, 2);
  let y = 190; for (const l of titleLines) { drawText(cv, f.b, l, 60, y, 46, WHITE); y += 58; }
  let vs = 132; while (vs > 56 && measure(f.k, t.value, vs) > W - 120) vs -= 4;
  y += vs - 10; drawText(cv, f.k, fit(f.k, t.value, vs, W - 120, vs), 60, y, vs, t.missing ? MUTED : YELLOW);
  y += 56; drawText(cv, f.r, fit(f.r, t.periodLine, 28, W - 120, 28), 60, y, 28, WHITE);
  y += 40; drawText(cv, f.r, fit(f.r, t.sourceLine, 28, W - 120, 28), 60, y, 28, MUTED);
  if (t.dateLine) { y += 40; drawText(cv, f.r, t.dateLine, 60, y, 28, MUTED); }
  return png(cv);
}

export function renderTitleCard(title: string, subtitle: string, domain: string, brand: string): Uint8Array {
  const f = getFonts(); const cv = new Canvas(NAVY); chrome(cv, f, domain, brand);
  let y = 260; for (const l of wrap(f.k, title, 72, W - 120, 3)) { drawText(cv, f.k, l, 60, y, 72, WHITE); y += 86; }
  cv.rect(60, y - 40, 120, 6, RED);
  drawText(cv, f.r, fit(f.r, subtitle, 32, W - 120, 32), 60, y + 20, 32, MUTED);
  return png(cv);
}
