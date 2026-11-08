import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CAM_SOURCES, camImageSrc, camKindLabel, camsForCountry, stepCam, type PublicCam } from "@/lib/public-cams";

/** Plays an operator's HLS live stream: native on Safari/iOS, hls.js (loaded on demand) elsewhere. */
function LiveVideo({ src, poster, onFail }: { src: string; poster: string; onFail: () => void }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    let hls: { destroy: () => void } | null = null; let dead = false;
    if (el.canPlayType("application/vnd.apple.mpegurl")) { el.src = src; void el.play().catch(() => {}); }
    else void import("hls.js").then(({ default: Hls }) => {
      if (dead) return;
      if (!Hls.isSupported()) { onFail(); return; }
      const h = new Hls({ lowLatencyMode: true }); hls = h;
      h.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) onFail(); });
      h.loadSource(src); h.attachMedia(el); void el.play().catch(() => {});
    }).catch(onFail);
    return () => { dead = true; hls?.destroy(); };
  }, [src]);
  return <video ref={v} poster={poster} autoPlay muted playsInline controls onError={onFail} className="mt-2 aspect-video w-full rounded bg-night object-cover" />;
}

/** Viewer for one public-authority camera. Pictures load straight from the operator. */
export function CamViewer({ cam, all, onPick, onClose }: { cam: PublicCam; all: PublicCam[]; onPick: (id: string) => void; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [broken, setBroken] = useState(false);
  const [liveDown, setLiveDown] = useState(false);
  useEffect(() => { setBroken(false); setLiveDown(false); const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, [cam.id]);
  const prev = useMemo(() => stepCam(cam, all, -1), [cam, all]);
  const next = useMemo(() => stepCam(cam, all, 1), [cam, all]);
  const src = CAM_SOURCES[cam.operator];
  return (
    <aside aria-label="Public camera" className="absolute bottom-3 left-3 z-30 w-[min(24rem,calc(100%-1.5rem))] max-sm:bottom-20 max-sm:left-2 max-sm:w-[calc(100%-1rem)] rounded-md border border-night-line bg-night-panel/95 p-2 text-xs text-night-fg shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold">{cam.live && !liveDown && <span className="mr-1 rounded bg-destructive px-1 py-0.5 text-[10px] font-bold text-destructive-foreground">● LIVE</span>}{cam.place}</p><p className="text-night-muted">{cam.operator}</p></div>
        <button onClick={onClose} aria-label="Close camera" className="rounded p-1 hover:bg-night"><X className="size-4" /></button>
      </div>
      {liveDown && <p className="mt-2 rounded bg-night px-2 py-1 text-night-muted">Live video unavailable — showing the latest still picture.</p>}
      {cam.live && !liveDown ? <LiveVideo src={cam.live} poster={camImageSrc(cam, now)} onFail={() => setLiveDown(true)} />
        : broken ? <div className="mt-2 grid aspect-video place-items-center rounded bg-night text-night-muted">Camera not answering right now</div>
        : cam.loop && !liveDown ? <video key={cam.id + Math.floor(now / 300_000)} src={cam.loop} poster={camImageSrc(cam, now)} autoPlay muted loop playsInline onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />
        : <img key={cam.id} src={camImageSrc(cam, now)} alt={`Camera view: ${cam.place}`} onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button onClick={() => prev && onPick(prev.id)} disabled={!prev} className="inline-flex min-h-8 items-center gap-1 rounded border border-night-line px-2 hover:bg-night disabled:opacity-40"><ChevronLeft className="size-3.5" />Previous</button>
        <button onClick={() => next && onPick(next.id)} disabled={!next} className="inline-flex min-h-8 items-center gap-1 rounded border border-night-line px-2 hover:bg-night disabled:opacity-40">Next<ChevronRight className="size-3.5" /></button>
      </div>
      <p className="mt-2 text-night-muted">{liveDown ? `Still picture, updated every ${cam.everyMin} min.` : `${camKindLabel(cam)}.`} Scene only — not a source of figures.</p>
      <p className="mt-1 flex flex-wrap gap-x-3"><a href={cam.loop ?? cam.image} target="_blank" rel="noreferrer noopener" className="underline">Open on operator's site</a><a href={src.licenceUrl} target="_blank" rel="noreferrer noopener" className="underline">{src.licence}</a></p>
    </aside>
  );
}

/** Clickable list of cameras for the picked country — a reliable alternative to tapping tiny dots. */
export function CamList({ cams, country, onPick }: { cams: PublicCam[]; country: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const list = useMemo(() => camsForCountry(cams, country).filter((c) => (!liveOnly || c.live) && c.place.toLowerCase().includes(q.trim().toLowerCase())), [cams, country, q, liveOnly]);
  const liveCount = useMemo(() => camsForCountry(cams, country).filter((c) => c.live).length, [cams, country]);
  const total = camsForCountry(cams, country).length;
  if (!total) return <p className="mt-1 pl-6 text-night-muted">No public cameras for this country yet. Pick the United Kingdom or United States.</p>;
  return (
    <div className="mt-1 pl-6">
      <p className="font-semibold">Cameras ({total.toLocaleString("en-GB")})</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search road or place" aria-label="Search cameras" className="mt-1 w-full rounded border border-night-line bg-night px-2 py-1" />
      {liveCount > 0 ? <label className="mt-1 flex min-h-8 items-center gap-2"><input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} />Live video only ({liveCount.toLocaleString("en-GB")})</label>
        : <p className="mt-1 text-night-muted">No live video here — these are short loops or stills.</p>}
      <ul className="mt-1 max-h-48 overflow-y-auto">
        {list.slice(0, 200).map((c) => <li key={c.id}><button onClick={() => onPick(c.id)} className="min-h-9 w-full rounded px-1 py-1 text-left hover:bg-night">{c.live && <span className="mr-1 text-[10px] font-bold text-destructive">● LIVE</span>}{c.place}</button></li>)}
      </ul>
      {list.length > 200 && <p className="text-night-muted">Showing 200 of {list.length.toLocaleString("en-GB")} — search to narrow.</p>}
    </div>
  );
}
