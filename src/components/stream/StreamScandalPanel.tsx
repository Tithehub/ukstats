import { QRCodeSVG } from "qrcode.react";
import { SCANDAL_IMAGES } from "@/lib/scandals.images";
import type { Segment } from "@/lib/stream-rundown";

/** Scandals slot: the site's own picture for the scandal being read (two script lines per scandal), with its credit. Background only — no figures. */
export function StreamScandalPanel({ seg, lineIndex }: { seg: Segment; lineIndex: number }) {
  const list = seg.scandals ?? [];
  if (!list.length) return null;
  const s = list[Math.min(list.length - 1, Math.max(0, Math.floor(lineIndex / 2)))]!;
  const img = SCANDAL_IMAGES[s.slug];
  return <div className="orbit-glass relative flex flex-col overflow-hidden border border-night-fg/20 text-night-fg shadow-xl">
    <div className="relative aspect-[16/10] w-full bg-primary">
      {img ? <img key={s.slug} src={img.src} alt={img.alt} className="h-full w-full object-cover motion-safe:animate-[fade-in_0.6s_ease-out]" />
        : <div className="flex h-full items-center justify-center p-8 text-center text-[34px] font-black text-primary-foreground">{s.title}</div>}
      <span className="absolute left-3 top-3 bg-night/85 px-3 py-1 font-mono text-[16px] font-bold uppercase tracking-wide">Background, not official statistics</span>
    </div>
    <div className="flex items-start gap-4 p-5">
      <div className="min-w-0 flex-1">
        <p className="text-[30px] font-black leading-tight">{s.title}</p>
        <p className="mt-2 text-[20px] text-night-muted">Status: {s.status}</p>
        {img && <p className="mt-3 font-mono text-[14px] text-night-muted">Photo: {img.credit} · {img.licence} · Wikimedia Commons</p>}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 rounded bg-background p-2 text-foreground">
        <QRCodeSVG value="https://ukstats.co.uk/scandals" size={110} level="M" aria-label="QR code to ukstats.co.uk/scandals" />
        <span className="font-mono text-[12px] font-bold">ukstats.co.uk/scandals</span>
      </div>
    </div>
  </div>;
}
