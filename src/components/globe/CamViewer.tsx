import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CAM_SOURCES, camImageSrc, camsForCountry, stepCam, type PublicCam } from "@/lib/public-cams";

/** Viewer for one public-authority camera. Pictures load straight from the operator. */
export function CamViewer({ cam, all, onPick, onClose }: { cam: PublicCam; all: PublicCam[]; onPick: (id: string) => void; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, [cam.id]);
  const prev = useMemo(() => stepCam(cam, all, -1), [cam, all]);
  const next = useMemo(() => stepCam(cam, all, 1), [cam, all]);
  const src = CAM_SOURCES[cam.operator];
  return (
    <aside aria-label="Public camera" className="absolute bottom-3 left-3 z-20 w-[min(22rem,calc(100%-1.5rem))] rounded-md border border-night-line bg-night-panel/95 p-2 text-xs text-night-fg shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold">{cam.place}</p><p className="text-night-muted">{cam.operator}</p></div>
        <button onClick={onClose} aria-label="Close camera" className="rounded p-1 hover:bg-night"><X className="size-4" /></button>
      </div>
      {broken ? <div className="mt-2 grid aspect-video place-items-center rounded bg-night text-night-muted">Camera not answering right now</div>
        : cam.loop ? <video key={cam.id + Math.floor(now / 300_000)} src={cam.loop} poster={camImageSrc(cam, now)} autoPlay muted loop playsInline onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />
        : <img key={cam.id} src={camImageSrc(cam, now)} alt={`Camera view: ${cam.place}`} onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button onClick={() => prev && onPick(prev.id)} disabled={!prev} className="inline-flex min-h-8 items-center gap-1 rounded border border-night-line px-2 hover:bg-night disabled:opacity-40"><ChevronLeft className="size-3.5" />Previous</button>
        <button onClick={() => next && onPick(next.id)} disabled={!next} className="inline-flex min-h-8 items-center gap-1 rounded border border-night-line px-2 hover:bg-night disabled:opacity-40">Next<ChevronRight className="size-3.5" /></button>
      </div>
      <p className="mt-2 text-night-muted">{cam.loop ? `Short video loop, updated about every ${cam.everyMin} minutes — not live video.` : `Still picture, updates about every ${cam.everyMin} minute${cam.everyMin === 1 ? "" : "s"}.`} Scene only — not a source of figures.</p>
      <p className="mt-1 flex flex-wrap gap-x-3"><a href={cam.loop ?? cam.image} target="_blank" rel="noreferrer noopener" className="underline">Open on operator's site</a><a href={src.licenceUrl} target="_blank" rel="noreferrer noopener" className="underline">{src.licence}</a></p>
    </aside>
  );
}

/** Clickable list of cameras for the picked country — a reliable alternative to tapping tiny dots. */
export function CamList({ cams, country, onPick }: { cams: PublicCam[]; country: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => camsForCountry(cams, country).filter((c) => c.place.toLowerCase().includes(q.trim().toLowerCase())), [cams, country, q]);
  const total = camsForCountry(cams, country).length;
  if (!total) return <p className="mt-1 pl-6 text-night-muted">No public cameras for this country yet. Pick the United Kingdom or United States.</p>;
  return (
    <div className="mt-1 pl-6">
      <p className="font-semibold">Cameras ({total.toLocaleString("en-GB")})</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search road or place" aria-label="Search cameras" className="mt-1 w-full rounded border border-night-line bg-night px-2 py-1" />
      <ul className="mt-1 max-h-48 overflow-y-auto">
        {list.slice(0, 200).map((c) => <li key={c.id}><button onClick={() => onPick(c.id)} className="w-full rounded px-1 py-1 text-left hover:bg-night">{c.place}</button></li>)}
      </ul>
      {list.length > 200 && <p className="text-night-muted">Showing 200 of {list.length.toLocaleString("en-GB")} — search to narrow.</p>}
    </div>
  );
}
