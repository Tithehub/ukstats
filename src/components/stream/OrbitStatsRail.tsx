import type { KeyFigure } from "@/lib/stream-extras";

/** Counts up once, then sits on the exact published string. */
function Roll({ value }: { value: string }) {
  return <>{value}</>;
}

/** Slim glass rail of always-on key figures, each with its publisher and period. Missing figures are skipped upstream. */
export function OrbitStatsRail({ items, checked }: { items: KeyFigure[]; checked: string | null }) {
  if (!items.length) return null;
  return <section data-fit className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-3 px-1 font-mono text-[14px] font-bold uppercase tracking-widest">
      <span className="text-electric-soft">Key figures · official sources</span>
      {checked && <span className="shrink-0 text-night-muted">{checked}</span>}
    </div>
    <div className="grid grid-cols-2 gap-3">
      {items.map((k, i) => <div key={k.id} className="orbit-glass relative min-w-0 overflow-hidden rounded-xl px-4 py-3 will-change-transform motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
        style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
        <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${k.alert ? "bg-destructive" : "bg-stream-yellow"}`} />
        <div className="truncate font-mono text-[13px] font-bold uppercase tracking-widest text-night-muted">{k.label}</div>
        <div className={`py-1 font-bold leading-tight tabular-nums ${k.value.length > 15 ? "text-[21px]" : "text-[32px]"}`}>{k.alert ? k.value : <Roll value={k.value} />}</div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-night-fg/10 px-1.5 font-mono text-[12px] font-bold uppercase text-electric-soft">{k.publisher}</span>
          {k.period && <span className="truncate font-mono text-[12px] text-night-muted">{k.period}</span>}
        </div>
      </div>)}
    </div>
  </section>;
}
