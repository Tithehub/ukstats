import { flagEmoji, GOLD_SOURCE } from "@/lib/gold";
import type { Segment } from "@/lib/stream-rundown";

/** Gold slot: the site's IMF top ten, the row being read highlighted (script line 0 is the intro, 1–10 the rows). UK row always marked. */
export function StreamGoldBoard({ seg, lineIndex }: { seg: Segment; lineIndex: number }) {
  const rows = seg.gold ?? [];
  // Line 0 is the intro; each later line reads two rows.
  const first = (lineIndex - 1) * 2;
  return <div className="orbit-glass relative overflow-hidden border border-night-fg/20 p-5 text-night-fg shadow-xl">
    <span aria-hidden className="orbit-accent absolute inset-x-0 top-0 h-[3px]" />
    <p className="font-mono text-[16px] font-bold uppercase tracking-widest text-electric-soft">Gold reserves · official filings</p>
    <p className="mt-1 text-[30px] font-black leading-tight">Top 10 countries by gold held</p>
    <ol className="mt-4 flex flex-col gap-1">
      {rows.map((r, i) => <li key={r.iso3} className={`flex items-center gap-3 px-3 py-[6px] text-[22px] transition-colors duration-300 ${i >= 0 && first >= 0 && (i === first || i === first + 1) ? "bg-destructive text-destructive-foreground" : r.iso3 === "GBR" ? "bg-electric-soft/20" : ""}`}>
        <span className="w-8 shrink-0 font-mono font-bold tabular-nums">{r.rank}</span>
        <span aria-hidden className="w-8 shrink-0">{flagEmoji(r.iso3) ?? ""}</span>
        <span className="min-w-0 flex-1 truncate font-bold">{r.name}</span>
        <span className="shrink-0 font-mono font-bold tabular-nums">{r.tonnes} t</span>
      </li>)}
    </ol>
    <p className="mt-3 font-mono text-[14px] text-night-muted">Source: {GOLD_SOURCE.name} · {rows[0]?.period ?? ""} · full table ukstats.co.uk/gold</p>
  </div>;
}
