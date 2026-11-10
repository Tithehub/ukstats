import { BarChart3, CloudSun, Globe2, Plane, Scale, ShieldAlert, Ship, ChevronRight } from "lucide-react";
import { fmtDate } from "@/lib/uk-stats";
import { sparkPath, tilePage, type OrbitScene } from "@/lib/stream-orbit";
import type { Headline, Segment, StreamCard } from "@/lib/stream-rundown";

const SCENE_LABEL: Record<OrbitScene, string> = {
  stats: "Official figures", headlines: "Headlines", weather: "Weather", warnings: "Official warnings",
  migration: "Small boats & migration", flights: "Skies now", world: "Around the world",
};

/** Counts up to the exact published string; non-numeric values appear as published. */
function CountUp({ value }: { value: string }) {
  // Animate the panel, never an intermediate number that could be mistaken for a real figure.
  return <>{value}</>;
}

function Tile({ card, active, i }: { card: StreamCard; active: boolean; i: number }) {
  return <div className={`flex min-w-0 flex-col overflow-hidden rounded-lg border-2 px-4 py-2 backdrop-blur-md transition-all duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 ${active ? "scale-[1.03] border-stream-yellow bg-night/90 shadow-[0_0_40px_-6px_var(--stream-yellow)]" : "border-night-line bg-night/70"}`}
    style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
    <div className={`truncate font-mono text-[14px] font-bold uppercase leading-tight tracking-widest ${active ? "text-stream-yellow" : "text-electric"}`}>{card.kicker}</div>
    <div className="truncate text-[19px] font-semibold leading-tight">{card.title}</div>
    <div className={`truncate py-0.5 font-black leading-[1.1] tabular-nums ${active ? "text-[38px] text-stream-yellow" : "text-[30px]"}`}><CountUp value={card.value} /></div>
    {(() => { const d = card.metric?.spark ? sparkPath(card.metric.spark, 200, 28) : null; return d ? <svg viewBox="0 0 200 28" preserveAspectRatio="none" className="h-[16px] w-full shrink-0 overflow-visible" aria-hidden><path d={d} fill="none" strokeWidth={3} className={active ? "stroke-stream-yellow" : "stroke-electric"} style={{ strokeDasharray: 1000, animation: "orbit-draw 1.8s ease-out both" }} /></svg> : null; })()}
    <div className="mt-auto truncate font-mono text-[14px] leading-tight text-night-muted">{card.source}{card.asOf ? ` · ${fmtDate(card.asOf)}` : ""}</div>
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
  const head = heads[step % heads.length] ?? null;
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
    <span className="sr-only">{place}</span>
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

/* ---------- Reference-video layout pieces (Globe Orbit v3) ---------- */

/** Big hero card on the right: the figure being read, counting up to the exact published value. */
export function OrbitHeroCard({ seg, scene, step, place }: { seg: Segment | undefined; scene: OrbitScene; step: number; place: string }) {
  const cards = seg?.cards ?? [];
  const heads = seg?.headlines ?? [];
  const card = cards[step % cards.length] ?? null;
  const head = !card ? heads[step % heads.length] ?? null : null;
  const label = scene === "world" ? `${place} · official figures` : seg?.title ?? SCENE_LABEL[scene];
  const red = scene === "warnings" || scene === "migration" || head?.official;
  const sp = card?.metric?.spark?.filter((x) => Number.isFinite(x)) ?? [];
  // No rise/fall percentage: the publisher does not state one, so we never compute it.
  const lo = sp.length ? Math.min(...sp) : 0, hi = sp.length ? Math.max(...sp) : 0;
  const bars = scene !== "migration" && sp.length >= 2;
  return <section key={`${seg?.id}-${step}`} data-fit className="orbit-glass relative overflow-hidden rounded-lg p-7 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="orbit-shine absolute inset-0 motion-safe:animate-[orbit-sweep_1.4s_ease-out_both]" /></div>
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0 text-[22px] font-bold uppercase leading-tight">{label}</span>
      <Globe2 className="size-9 shrink-0 text-electric-soft" aria-hidden />
    </div>
    <div className="mt-4 h-px bg-night-fg/20"><div className={`h-[3px] w-44 ${red ? "bg-destructive" : "bg-destructive"} motion-safe:animate-in motion-safe:slide-in-from-left-10 motion-safe:duration-700`} /></div>
    {card ? <>
      <p className="mt-7 line-clamp-3 text-[42px] font-bold uppercase leading-[1.1]">{card.title}</p>
      <div className="mt-5 flex items-baseline gap-5">
        <span className={`min-w-0 font-bold leading-none tabular-nums text-electric-soft ${card.value.length > 12 ? "text-[48px]" : card.value.length > 8 ? "text-[62px]" : "text-[80px]"}`}><CountUp value={card.value} /></span>
        {(scene === "weather" || scene === "warnings") && <span className="shrink-0 rounded bg-stream-yellow px-3 py-1 text-[26px] font-black uppercase text-night motion-safe:animate-pulse">⚠ Alert</span>}
      </div>
      {bars && <div className="mt-4 flex h-[56px] items-end gap-1.5" aria-hidden>{sp.slice(-16).map((x, i, a) => <span key={i} className={`flex-1 origin-bottom rounded-t ${i === a.length - 1 ? "bg-stream-yellow" : "bg-electric/70"}`} style={{ height: `${15 + ((x - lo) / (hi - lo || 1)) * 85}%`, animation: `orbit-grow 0.9s ${i * 60}ms ease-out both` }} />)}</div>}
      {(() => { const d = !bars && sp.length >= 2 ? sparkPath(sp, 560, 48) : null; return d ? <svg viewBox="0 0 560 48" preserveAspectRatio="none" className="mt-4 h-[44px] w-full overflow-visible" aria-hidden><path d={d} fill="none" strokeWidth={4} className="stroke-stream-yellow" style={{ strokeDasharray: 1000, animation: "orbit-draw 2s ease-out both" }} /></svg> : null; })()}
      <p className="mt-6 break-words border-t border-night-fg/15 pt-4 font-mono text-[15px] leading-relaxed text-night-muted">{card.source}{card.period ? ` · ${card.period}` : ""}{card.asOf ? ` · ${fmtDate(card.asOf)}` : ""}</p>
    </> : head ? <>
      <span className={`mt-5 inline-block rounded px-3 py-1 font-mono text-[16px] font-black uppercase tracking-widest ${head.official ? "bg-destructive text-destructive-foreground" : "bg-electric text-night"}`}>{head.official ? "Official warning" : "News report — not official"}</span>
      <p className="mt-4 line-clamp-4 text-[40px] font-black leading-[1.12]">{head.text}</p>
      <p className="mt-4 truncate font-mono text-[18px] text-night-muted">{head.publisher}{head.time ? ` · ${fmtDate(head.time)}` : ""}</p>
    </> : <p className="mt-5 text-[28px] text-night-muted">No figure is published for this item.</p>}
  </section>;
}

/** Small tiles that slide in under the hero card with the segment's other figures. */
export function OrbitMiniTiles({ seg, step }: { seg: Segment | undefined; step: number }) {
  const cards = seg?.cards ?? [];
  if (cards.length < 2) return null;
  const pick = [1, 2, 3].flatMap((i) => { const c = cards[(step + i) % cards.length]; return c ? [c] : []; }).filter((c, i, a) => a.findIndex((x) => x.title === c.title) === i && c !== cards[step % cards.length]);
  return <div key={`${seg?.id}-${step}`} className="grid grid-cols-2 gap-3">
    {pick.slice(0, 2).map((c, i) => <div key={c.title} className="orbit-glass min-w-0 rounded-lg px-4 py-3 motion-safe:animate-in motion-safe:slide-in-from-bottom-6" style={{ animationDelay: `${200 + i * 150}ms`, animationFillMode: "both" }}>
      <div className="line-clamp-2 min-h-[36px] text-[15px] font-bold uppercase leading-tight text-night-muted">{c.title}</div>
      <div className="truncate text-[28px] font-black tabular-nums"><CountUp value={c.value} /></div>
      <div className="truncate font-mono text-[12px] text-night-muted">{c.source}</div>
    </div>)}
  </div>;
}

const ICON = [[/debt|borrow|spend|tax|gdp|inflation|price/i, BarChart3], [/boat|migra|asylum|cross/i, Ship], [/weather|rain|wind|storm/i, CloudSun], [/warn|alert/i, ShieldAlert], [/crime|police/i, Scale], [/flight|sky/i, Plane], [/world|around|countr/i, Globe2]] as const;
const iconFor = (t: string) => ICON.find(([r]) => r.test(t))?.[1] ?? ChevronRight;

/** NEXT UP rail like the reference: icon, title and real start time, the next item highlighted. */
export function OrbitNextUp({ now, items }: { now: string; items: { title: string; time: string | null }[] }) {
  return <section className="orbit-glass overflow-hidden rounded-lg">
    <div className="flex items-center gap-2 px-4 pt-3"><span className="h-5 w-1 bg-destructive" /><span className="font-mono text-[20px] font-black uppercase tracking-widest">Next up</span></div>
    <div key={now} className="mx-3 mt-2 truncate rounded border-l-4 border-destructive bg-destructive/15 px-3 py-1.5 text-[18px] font-bold motion-safe:animate-in motion-safe:slide-in-from-left-4">
      <span className="mr-2 font-mono text-[13px] uppercase text-destructive">On air</span>{now}</div>
    <ol className="space-y-1 p-3">{items.slice(0, 3).map((u, i) => <li key={u.title} className={`flex items-center gap-3 rounded px-2 py-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 ${i === 0 ? "border-l-4 border-stream-yellow bg-stream-yellow/15" : ""}`} style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}>
      <span className="w-10 shrink-0 text-electric-soft" aria-hidden>{(() => { const Icon = iconFor(u.title); return <Icon className="size-8" />; })()}</span>
      <span className="min-w-0 flex-1"><span className="block text-[19px] font-bold uppercase leading-tight">{u.title}</span>{u.time && <span className="font-mono text-[16px] text-night-muted">{u.time}</span>}</span>
    </li>)}</ol>
  </section>;
}

/** Centre lower-third: "UK STATS LIVE • SEGMENT" with a wipe on every change and a running shine. */
export function OrbitLowerThird({ tag }: { tag: string }) {
  return <div className="relative flex h-[72px] overflow-hidden rounded shadow-[0_10px_40px_-10px_oklch(0_0_0/0.9)]">
    <span className="flex items-center bg-destructive px-6 text-[40px] font-black uppercase text-destructive-foreground">UK Stats Live</span>
    <span key={tag} className="flex items-center gap-4 bg-night/90 px-6 text-[40px] font-black uppercase text-stream-yellow motion-safe:animate-in motion-safe:slide-in-from-left-full motion-safe:duration-500">
      <span aria-hidden>•</span>{tag}</span>
    <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_40%,oklch(1_0_0/0.25)_50%,transparent_60%)] motion-safe:animate-[orbit-shine_4s_ease-in-out_infinite]" />
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[4px] bg-stream-yellow" />
  </div>;
}

/** Bottom bar: BREAKING NEWS tab, non-stop ticker of real items (official ones red), London clock. */
export function OrbitTicker({ items, clock }: { items: { text: string; official: boolean }[]; clock: string }) {
  const list = items.length ? items : [{ text: "Official UK statistics with sources and dates · ukstats.co.uk", official: false }];
  const secs = Math.max(40, list.reduce((n, x) => n + x.text.length, 0) / 9);
  return <div className="flex h-full items-stretch border-t border-night-line bg-night/95">
    <span className="flex shrink-0 items-center bg-stream-yellow px-6 text-[26px] font-black uppercase text-night [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] pr-10">Breaking news</span>
    <div className="relative min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-y-0 flex w-max items-center whitespace-nowrap motion-safe:animate-[orbit-marquee_linear_infinite]" style={{ animationDuration: `${secs}s` }}>
        {[0, 1].map((k) => <span key={k} className="flex items-center">{list.map((x, i) => <span key={i} className="flex items-center px-6 text-[24px] font-bold uppercase">
          {x.official && <span className="mr-3 rounded bg-destructive px-2 font-mono text-[14px] text-destructive-foreground">Official</span>}{x.text}<span className="ml-12 text-stream-yellow" aria-hidden>|</span></span>)}</span>)}
      </div>
    </div>
    <span className="flex shrink-0 items-center bg-destructive px-6 font-mono text-[32px] font-black tabular-nums text-destructive-foreground">{clock}<span className="motion-safe:animate-pulse">&nbsp;</span></span>
  </div>;
}
