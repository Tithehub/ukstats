import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { SEGMENT_MS, buildSegments, type SegmentKind } from "@/lib/globe-broadcast";
import type { OfficialWarning } from "@/lib/unrest";
import type { FeedItem } from "@/lib/video-feed";
import { fmtTime } from "@/components/globe/LiveFeed";
import { fmtDate } from "@/lib/uk-stats";

export type BulletinStat = { label: string; value: string };
const SEG_LABEL: Record<SegmentKind, string> = { stats: "Main figures", warnings: "Official warnings", news: "Latest news (not official)" };
const KIND_T = { official: "Official", msm: "MSM", alt: "Alternative" } as const;

/** Timed bulletin for one country: figures → official warnings → news, then hands over to the next country. */
export function BroadcastPanel({ name, stats, statSource, warnings, videos, onNextCountry, onPrevCountry, onStop }: {
  name: string; stats: BulletinStat[]; statSource: { name: string; url: string } | null;
  warnings: OfficialWarning[]; videos: FeedItem[];
  onNextCountry: () => void; onPrevCountry: () => void; onStop: () => void;
}) {
  const segs = buildSegments({ hasStats: stats.length > 0, warningCount: warnings.length, videoCount: videos.length });
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [playing, setPlaying] = useState<FeedItem | null>(null);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  useEffect(() => { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPaused(true); }, []);
  useEffect(() => { setI(0); setPlaying(null); elapsed.current = 0; setProgress(0); }, [name]);
  useEffect(() => { elapsed.current = 0; setProgress(0); }, [i]);
  const seg = segs[Math.min(i, segs.length - 1)]!;
  const halted = paused || hover || !!playing;

  useEffect(() => {
    if (halted) return;
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last; last = t;
      if (elapsed.current >= SEGMENT_MS) {
        if (i + 1 < segs.length) setI(i + 1); else onNextCountry();
        return;
      }
      setProgress(elapsed.current / SEGMENT_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [halted, i, segs.length, onNextCountry]);

  const remaining = Math.ceil(((segs.length - i) * SEGMENT_MS - elapsed.current) / 1000);
  const BTN = "inline-flex size-8 shrink-0 items-center justify-center rounded border border-night-line hover:bg-night";

  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  const TAB = { stats: "Figures", warnings: "Warnings", news: "News" } as const;

  return <section aria-label={`Live bulletin: ${name}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} className="overflow-hidden rounded-md border border-night-line bg-night shadow-lg [contain:layout]">
    <header className="flex h-9 items-center gap-2 bg-desk px-2 text-desk-fg">
      <span className="rounded-sm bg-onair px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-desk-fg">{halted ? "Paused" : "On air"}</span>
      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wide">{name}</h3>
      <span className="font-mono text-[11px] tabular-nums text-desk-muted">{clock} UK</span>
      <span className="w-10 text-right font-mono text-[11px] tabular-nums text-desk-fg">{halted ? "—" : `${Math.max(0, remaining)}s`}</span>
    </header>
    <div role="tablist" aria-label="Bulletin sections" className="flex border-b border-night-line">{segs.map((k, n) => <button key={k} role="tab" aria-selected={n === i} onClick={() => setI(n)} className={`relative flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider ${n === i ? "text-night-fg" : "text-night-muted"}`}>
      {TAB[k]}<span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-night-line"><span className="block h-full bg-electric" style={{ width: `${n < i ? 100 : n === i ? progress * 100 : 0}%` }} /></span></button>)}</div>

    <div className="h-[212px] overflow-hidden p-2.5" aria-live="polite">
      <div key={`${name}-${seg}`} className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
        {seg === "stats" && <><dl className="grid grid-cols-3 gap-1.5">{stats.slice(0, 6).map((s) => { const m = /^(.*) \((\d{4})\)$/.exec(s.value); return <div key={s.label} className="h-[78px] rounded border border-night-line bg-night-panel p-1.5"><dt className="line-clamp-2 text-[10px] leading-tight text-night-muted">{s.label}</dt><dd className="mt-1 truncate font-mono text-[15px] font-semibold tabular-nums">{m ? m[1] : s.value}</dd>{m && <dd className="font-mono text-[10px] text-night-muted">{m[2]}</dd>}</div>; })}</dl>
          {statSource && <p className="mt-1.5 truncate text-[10px] text-night-muted">Source: <a className="underline" href={statSource.url} target="_blank" rel="noreferrer noopener">{statSource.name}</a></p>}</>}

        {seg === "warnings" && (warnings[0] ? (() => { const w = warnings[0]!; return <article className="flex h-full flex-col rounded border-l-2 border-onair bg-night-panel p-2.5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-night-muted"><span>{w.source}</span>{w.level && <span className="rounded-sm border border-ageing/60 px-1 text-ageing">Level {w.level}</span>}{warnings.length > 1 && <span>+{warnings.length - 1} more</span>}</p>
          <p className="mt-1.5 line-clamp-4 text-[13px] leading-snug">“{w.text || "No change note published"}”</p>
          <p className="mt-auto flex items-center justify-between pt-1 font-mono text-[10px] text-night-muted"><span>Updated {fmtDate(w.updated)}</span><a className="inline-flex items-center gap-1 underline" href={w.url} target="_blank" rel="noreferrer noopener">Official advice <ExternalLink className="size-3" /></a></p>
        </article>; })() : <p className="grid h-full place-items-center text-center text-xs text-night-muted">No current UK or US government travel advice on file for {name}.</p>)}

        {seg === "news" && <ul className="space-y-1.5">{videos.slice(0, 3).map((v) => <li key={v.id}><button onClick={() => setPlaying(v)} className="flex h-[62px] w-full gap-2 rounded text-left hover:bg-night-panel">
          <span className="relative aspect-video h-full shrink-0 overflow-hidden rounded bg-night-panel"><img src={v.thumb} alt="" width={110} height={62} loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />{v.live && <span className="absolute left-0.5 top-0.5 rounded-sm bg-onair px-1 font-mono text-[9px] font-bold text-night-fg">LIVE</span>}</span>
          <span className="min-w-0 flex-1 text-xs"><span className="line-clamp-2 leading-snug">{v.title}</span><span className="block truncate font-mono text-[10px] text-night-muted">{KIND_T[v.kind]} · {v.channel} · {fmtTime(v.published)}</span></span>
        </button></li>)}</ul>}
      </div>
    </div>

    {playing && <div className="border-t border-night-line p-2"><div className="flex items-start justify-between gap-2"><p className="line-clamp-1 text-xs font-semibold">{playing.title}</p><button aria-label="Close video" onClick={() => setPlaying(null)} className="rounded p-1 hover:bg-night-panel"><X className="size-4" /></button></div>
      <div className="mt-1 aspect-video overflow-hidden rounded bg-night-panel"><iframe title={playing.title} src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="size-full" /></div></div>}

    <div className="flex h-10 items-center gap-1 border-t border-night-line px-2" aria-label="Bulletin controls">
      <button className={BTN} aria-label="Previous country" onClick={onPrevCountry}><SkipBack className="size-3.5" /></button>
      <button className={BTN} aria-label="Previous section" disabled={i === 0} onClick={() => setI(Math.max(0, i - 1))}><ChevronLeft className="size-3.5" /></button>
      <button className={BTN} aria-label={paused ? "Play bulletin" : "Pause bulletin"} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button>
      <button className={BTN} aria-label="Next section" onClick={() => (i + 1 < segs.length ? setI(i + 1) : onNextCountry())}><ChevronRight className="size-3.5" /></button>
      <button className={BTN} aria-label="Next country" onClick={onNextCountry}><SkipForward className="size-3.5" /></button>
      <button className="ml-auto h-8 rounded border border-night-line px-2 text-xs hover:bg-night-panel" onClick={onStop}>Stop<span className="max-sm:hidden"> broadcast</span></button>
    </div>
  </section>;
}
