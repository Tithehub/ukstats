import { useEffect, useState } from "react";
import { fmtDate } from "@/lib/uk-stats";
import { countUp, sparkPath, tilePage, type OrbitScene } from "@/lib/stream-orbit";
import type { Headline, Segment, StreamCard } from "@/lib/stream-rundown";

const SCENE_LABEL: Record<OrbitScene, string> = {
  stats: "Official figures", headlines: "Headlines", weather: "Weather", warnings: "Official warnings",
  migration: "Small boats & migration", flights: "Skies now", world: "Around the world",
};

/** Counts up to the exact published string; non-numeric values appear as published. */
function CountUp({ value }: { value: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setP(k); if (k < 1) raf = requestAnimationFrame(tick); };
    setP(0); raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{countUp(value, p)}</>;
}

function Tile({ card, active, i }: { card: StreamCard; active: boolean; i: number }) {
  return <div className={`flex min-w-0 flex-col rounded-lg border-2 px-4 py-3 backdrop-blur-md transition-all duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 ${active ? "scale-[1.03] border-stream-yellow bg-night/90 shadow-[0_0_40px_-6px_var(--stream-yellow)]" : "border-night-line bg-night/70"}`}
    style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
    <div className={`truncate font-mono text-[16px] font-bold uppercase tracking-widest ${active ? "text-stream-yellow" : "text-electric"}`}>{card.kicker}</div>
    <div className="line-clamp-1 text-[20px] font-semibold leading-tight">{card.title}</div>
    <div className={`mt-1 truncate font-black leading-none tabular-nums ${active ? "text-[44px] text-stream-yellow" : "text-[34px]"}`}><CountUp value={card.value} /></div>
    {(() => { const d = card.metric?.spark ? sparkPath(card.metric.spark, 200, 28) : null; return d ? <svg viewBox="0 0 200 28" className="mt-1 h-[24px] w-full overflow-visible" aria-hidden><path d={d} fill="none" strokeWidth={3} className={active ? "stroke-stream-yellow" : "stroke-electric"} style={{ strokeDasharray: 1000, animation: "orbit-draw 1.8s ease-out both" }} /></svg> : null; })()}
    <div className="mt-auto truncate pt-1 font-mono text-[15px] text-night-muted">{card.source}{card.asOf ? ` · ${fmtDate(card.asOf)}` : ""}</div>
  </div>;
}

function HeadlineCard({ head, warning }: { head: Headline; warning: boolean }) {
  return <div key={head.text} className={`flex flex-col rounded-lg border-2 bg-night/85 p-6 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-8 ${warning || head.official ? "border-destructive" : "border-electric"}`}>
    <div className={`self-start rounded px-3 py-1 font-mono text-[18px] font-black uppercase tracking-widest ${head.official ? "bg-destructive text-destructive-foreground" : "bg-electric text-night"}`}>{head.official ? "Official warning" : "News report — not official"}</div>
    <p className="mt-4 line-clamp-5 text-[38px] font-black leading-[1.15]">{head.text}</p>
    <p className="mt-4 truncate font-mono text-[20px] text-night-muted">{head.publisher}{head.time ? ` · ${fmtDate(head.time)}` : ""}</p>
  </div>;
}

/** Right-hand scene panel: tiles for figures, a flipping card for headlines and warnings. */
export function OrbitPanel({ seg, scene, step, place }: { seg: Segment | undefined; scene: OrbitScene; step: number; place: string }) {
  const cards = seg?.cards ?? [];
  const heads = seg?.headlines ?? [];
  const { idx, start } = tilePage(cards.length, step);
  const page = cards.slice(start, start + 8);
  const head = heads.length ? heads[step % heads.length]! : null;
  const active = cards[idx];
  return <section data-fit className="relative flex h-full flex-col gap-3 overflow-hidden">
    <div key={`sweep-${seg?.id}`} aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(100deg,transparent_30%,oklch(1_0_0/0.14)_50%,transparent_70%)] motion-safe:animate-[orbit-sweep_1.2s_ease-out_both]" />
    <div key={seg?.id} className="flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4">
      <span className={`h-8 w-2 ${scene === "warnings" || scene === "migration" ? "bg-destructive" : "bg-stream-yellow"}`} />
      <span className="truncate font-mono text-[22px] font-black uppercase tracking-widest">{SCENE_LABEL[scene]} · {place}</span>
    </div>
    {page.length ? <>
      <div key={`${seg?.id}-${start}`} className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-3">
        {page.map((c, i) => <Tile key={`${c.title}-${i}`} card={c} i={i} active={start + i === idx} />)}
      </div>
      {active && <div className="shrink-0 truncate rounded bg-night/80 px-3 py-1.5 font-mono text-[17px] text-night-muted">
        Reading: <span className="text-night-fg">{active.title}</span>{active.period ? ` · ${active.period}` : ""} · next: {active.nextDue ? fmtDate(active.nextDue) : "not announced"}
      </div>}
      {head && <div className="shrink-0"><MiniHead head={head} /></div>}
    </> : head ? <HeadlineCard head={head} warning={scene === "warnings"} />
      : <div className="rounded-lg border-2 border-night-line bg-night/80 p-6 text-[24px] text-night-muted">No figure is published for this item.</div>}
  </section>;
}

function MiniHead({ head }: { head: Headline }) {
  return <div key={head.text} className="flex items-center gap-3 rounded border-2 border-night-line bg-night/85 px-3 py-2 motion-safe:animate-in motion-safe:fade-in">
    <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[14px] font-black uppercase ${head.official ? "bg-destructive text-destructive-foreground" : "bg-electric text-night"}`}>{head.official ? "Official" : "News"}</span>
    <span className="truncate text-[20px] font-semibold">{head.text}</span>
  </div>;
}

/** Pulse ring + country name over the globe's centre, re-triggered on each country change. */
export function OrbitPulse({ place, scene }: { place: string; scene: OrbitScene }) {
  const red = scene === "warnings" || scene === "migration";
  return <div key={place} className="pointer-events-none flex flex-col items-center">
    <div className="relative size-[160px]">
      {[0, 1, 2].map((i) => <span key={i} className={`absolute inset-0 rounded-full border-4 motion-safe:animate-ping ${red ? "border-destructive" : "border-stream-yellow"}`} style={{ animationDelay: `${i * 0.6}s`, animationDuration: "2.4s", opacity: 0.6 }} />)}
      <span className={`absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${red ? "bg-destructive" : "bg-stream-yellow"}`} />
    </div>
    <span className="mt-2 rounded bg-night/85 px-4 py-1 text-[30px] font-black uppercase tracking-wide motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90">{place}</span>
  </div>;
}

/** Next-up rail with the current segment highlighted. */
export function OrbitRail({ now, items }: { now: string; items: string[] }) {
  return <section className="overflow-hidden rounded-lg border-2 border-night-line bg-night/80 backdrop-blur-md">
    <div className="bg-destructive px-4 py-1 font-mono text-[18px] font-black uppercase tracking-widest text-destructive-foreground">On air</div>
    <div key={now} className="truncate border-l-8 border-stream-yellow px-4 py-2 text-[24px] font-black motion-safe:animate-in motion-safe:slide-in-from-left-4">{now}</div>
    <div className="px-4 pt-1 font-mono text-[16px] font-bold uppercase tracking-widest text-electric">Next up</div>
    <ol className="space-y-0.5 px-4 pb-2 text-[21px]">{items.map((u) => <li key={u} className="truncate text-night-muted">▸ {u}</li>)}</ol>
  </section>;
}
