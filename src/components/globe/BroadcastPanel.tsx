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
  const BTN = "inline-flex size-8 items-center justify-center rounded border border-night-line hover:bg-night";

  return <section aria-label={`Live bulletin: ${name}`} aria-live="polite" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} className="rounded-md border border-electric/50 bg-night p-3">
    <div className="flex items-center justify-between gap-2">
      <p className="font-mono text-[11px] uppercase text-overdue"><span className="mr-1 inline-block size-1.5 rounded-full bg-overdue pulse-dot" />On air · {name}</p>
      <span className="font-mono text-[11px] text-night-muted">{halted ? "Paused" : `Next country in ${Math.max(0, remaining)}s`}</span>
    </div>
    <div className="mt-2 flex gap-1" aria-hidden="true">{segs.map((k, n) => <div key={k} className="h-1 flex-1 overflow-hidden rounded bg-night-line"><div className="h-full bg-electric" style={{ width: `${n < i ? 100 : n === i ? progress * 100 : 0}%` }} /></div>)}</div>
    <h3 className="mt-2 text-sm font-semibold">{SEG_LABEL[seg]}</h3>

    {seg === "stats" && <><dl className="mt-1 grid grid-cols-2 gap-1.5 text-xs">{stats.map((s) => <div key={s.label} className="rounded border border-night-line p-1.5"><dt className="text-[10px] text-night-muted">{s.label}</dt><dd className="font-mono">{s.value}</dd></div>)}</dl>
      {statSource && <p className="mt-1 text-[10px] text-night-muted">Source: <a className="underline" href={statSource.url} target="_blank" rel="noreferrer noopener">{statSource.name}</a></p>}</>}

    {seg === "warnings" && (warnings.length ? <ul className="mt-1 space-y-1.5 text-xs">{warnings.slice(0, 2).map((w) => <li key={w.source + w.url}>
      <p className="font-mono text-[10px] uppercase text-night-muted">{w.source}{w.level ? ` · Level ${w.level}` : ""} · updated {fmtDate(w.updated)}</p>
      <p className="line-clamp-3">“{w.text || "No change note published"}”</p>
      <a className="inline-flex items-center gap-1 underline" href={w.url} target="_blank" rel="noreferrer noopener">Official advice <ExternalLink className="size-3" /></a></li>)}</ul>
      : <p className="mt-1 text-xs text-night-muted">No current UK or US government travel advice on file for {name}.</p>)}

    {seg === "news" && <ul className="mt-1 space-y-1.5">{videos.slice(0, 3).map((v) => <li key={v.id} className="flex gap-2">
      <img src={v.thumb} alt="" width={96} height={54} loading="lazy" referrerPolicy="no-referrer" className="h-[54px] w-[96px] shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1 text-xs"><p className="line-clamp-2">{v.title}</p>
        <p className="font-mono text-[10px] text-night-muted">{v.live ? "LIVE · " : ""}{KIND_T[v.kind]} · {v.channel} · {fmtTime(v.published)}</p>
        <button onClick={() => setPlaying(v)} className="mt-0.5 inline-flex items-center gap-1 text-electric-soft underline"><Play className="size-3" />Watch here</button></div>
    </li>)}</ul>}

    {playing && <div className="mt-2"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold">{playing.title}</p><button aria-label="Close video" onClick={() => setPlaying(null)} className="rounded p-1 hover:bg-night-panel"><X className="size-4" /></button></div>
      <div className="mt-1 aspect-video overflow-hidden rounded"><iframe title={playing.title} src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="size-full" /></div></div>}

    <div className="mt-3 flex flex-wrap items-center gap-1" aria-label="Bulletin controls">
      <button className={BTN} aria-label="Previous country" onClick={onPrevCountry}><SkipBack className="size-3.5" /></button>
      <button className={BTN} aria-label="Previous segment" disabled={i === 0} onClick={() => setI(Math.max(0, i - 1))}><ChevronLeft className="size-3.5" /></button>
      <button className={BTN} aria-label={paused ? "Play bulletin" : "Pause bulletin"} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}</button>
      <button className={BTN} aria-label="Next segment" onClick={() => (i + 1 < segs.length ? setI(i + 1) : onNextCountry())}><ChevronRight className="size-3.5" /></button>
      <button className={BTN} aria-label="Next country" onClick={onNextCountry}><SkipForward className="size-3.5" /></button>
      <button className="ml-auto rounded border border-night-line px-2 py-1 text-xs hover:bg-night" onClick={onStop}>Stop broadcast</button>
    </div>
  </section>;
}
