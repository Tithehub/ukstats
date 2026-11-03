import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Pause, Play, X } from "lucide-react";
import type { BroadcastKind } from "@/lib/broadcast-channels.data";
import { ago, filterFeed, type FeedAge, type FeedItem, type FeedPayload } from "@/lib/video-feed";
import { fmtDate } from "@/lib/uk-stats";

const KIND_LABEL: Record<BroadcastKind, { t: string; cls: string }> = {
  official: { t: "Official", cls: "border-fresh/60 text-fresh" },
  msm: { t: "MSM", cls: "border-electric-soft/60 text-electric-soft" },
  alt: { t: "Alternative", cls: "border-ageing/60 text-ageing" },
};
export function fmtTime(iso: string) {
  const t = new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return `${fmtDate(iso)}, ${t} UK`;
}

function Player({ v, onClose }: { v: FeedItem; onClose: () => void }) {
  return <div className="mt-2 rounded border border-night-line bg-night p-2">
    <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{v.title}</p><button aria-label="Close video" onClick={onClose} className="shrink-0 rounded p-1 hover:bg-night-panel"><X className="size-4" /></button></div>
    <div className="mt-2 aspect-video w-full overflow-hidden rounded bg-night-panel">
      <iframe title={v.title} src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="size-full" />
    </div>
    <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs underline">Open on YouTube <ExternalLink className="size-3" /></a>
  </div>;
}

/** Live news feed from the verified channels. Media items are never official statistics or warnings. */
export function LiveFeed({ feed, country, countryName, kind, hours, paused, onFilter, onPause, onCountry }: {
  feed: FeedPayload | null | undefined; country?: string | undefined; countryName?: string | undefined;
  kind?: BroadcastKind | undefined; hours?: FeedAge | undefined; paused: boolean;
  onFilter?: (p: { fk?: BroadcastKind | undefined; fa?: FeedAge | undefined }) => void; onPause?: () => void; onCountry?: (k: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const [playing, setPlaying] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!feed) return;
    const ids = feed.items.map((i) => i.id);
    if (seen.current) { const n = ids.filter((id) => !seen.current!.has(id)); if (n.length) { setFresh(new Set(n)); setTimeout(() => setFresh(new Set()), 60_000); } }
    seen.current = new Set(ids);
  }, [feed]);
  const list = useMemo(() => (feed ? filterFeed(feed.items, { kind, country, hours }, now) : []), [feed, kind, country, hours, now]);
  const v = playing ? feed?.items.find((i) => i.id === playing) : undefined;

  return <div className="text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-mono text-[11px] text-night-muted"><span className={`mr-1 inline-block size-1.5 rounded-full ${paused ? "bg-night-muted" : "bg-overdue pulse-dot"}`} />{!feed ? "Connecting…" : `Last checked ${fmtTime(feed.fetchedAt)}`}</p>
      {onPause && <button onClick={onPause} aria-pressed={paused} className="inline-flex items-center gap-1 rounded border border-night-line px-2 py-0.5 text-xs hover:bg-night">{paused ? <Play className="size-3" /> : <Pause className="size-3" />}{paused ? "Resume updates" : "Pause updates"}</button>}
    </div>
    {onFilter && <div className="mt-2 flex flex-wrap gap-1 text-xs" role="group" aria-label="Filter live feed">
      {([[undefined, "All"], ["official", "Official"], ["msm", "MSM"], ["alt", "Alternative"]] as const).map(([k, l]) => <button key={l} aria-pressed={kind === k} onClick={() => onFilter({ fk: k })} className={`rounded border px-2 py-1 ${kind === k ? "border-electric" : "border-night-line"}`}>{l}</button>)}
      {([[1, "1h"], [6, "6h"], [24, "Today"]] as const).map(([h, l]) => <button key={h} aria-pressed={(hours ?? 24) === h} onClick={() => onFilter({ fa: h === 24 ? undefined : h })} className={`rounded border px-2 py-1 ${(hours ?? 24) === h ? "border-electric" : "border-night-line"}`}>{l}</button>)}
    </div>}
    {v && <Player v={v} onClose={() => setPlaying(null)} />}
    {!feed ? <p className="mt-2 text-night-muted">Loading the live feed…</p>
      : !feed.connected ? <p className="mt-2 text-night-muted">Feed not connected yet. Nothing is shown until YouTube answers — no items are made up.</p>
      : list.length === 0 ? <p className="mt-2 text-night-muted">No videos {countryName ? `for ${countryName} ` : ""}in this period from the verified channels.</p>
      : <ul className="mt-2 space-y-1.5">{list.slice(0, 40).map((i) => <li key={i.id}>
        <button onClick={() => setPlaying(i.id)} className={`flex w-full gap-2 rounded border p-1.5 text-left hover:bg-night ${fresh.has(i.id) ? "border-electric animate-in fade-in slide-in-from-top-2" : "border-night-line"}`}>
          <span className="relative shrink-0"><img src={i.thumb} alt="" width={112} height={63} loading="lazy" referrerPolicy="no-referrer" className="h-[63px] w-[112px] rounded bg-night object-cover" />
            {i.live && <span className="absolute left-1 top-1 rounded bg-overdue px-1 font-mono text-[10px] font-bold text-night-fg">LIVE</span>}</span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-[13px] leading-snug">{i.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-night-muted"><img src={i.avatar} alt="" width={14} height={14} referrerPolicy="no-referrer" className="size-3.5 rounded-full" /><span className="truncate">{i.channel}</span></span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[10px] text-night-muted">
              <span className={`rounded border px-1 ${KIND_LABEL[i.kind].cls}`}>{KIND_LABEL[i.kind].t}</span>
              {fresh.has(i.id) && <span className="rounded bg-electric px-1 text-night">New</span>}
              <span>{fmtTime(i.published)} · {ago(i.published, now)}</span>
              {!country && onCountry && <span role="link" tabIndex={0} onClick={(e) => { e.stopPropagation(); onCountry(i.country); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onCountry(i.country); } }} className="capitalize underline">{i.country}</span>}
            </span>
          </span>
        </button></li>)}</ul>}
    <p className="mt-2 text-[11px] text-night-muted">Newest videos from YouTube-verified channels, titles exactly as published, updated every 2 minutes. MSM and Alternative channels are not official sources; UKStats does not verify their claims. Public live streaming is on hold pending legal review.</p>
  </div>;
}
