import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CAM_SOURCES, camImageSrc, type PublicCam } from "@/lib/public-cams";

/** Viewer for one public-authority camera. Pictures load straight from the operator. */
export function CamViewer({ cam, onClose }: { cam: PublicCam; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, [cam.id]);
  const src = CAM_SOURCES[cam.operator];
  return (
    <aside aria-label="Public camera" className="absolute bottom-3 left-3 z-20 w-[min(22rem,calc(100%-1.5rem))] rounded-md border border-night-line bg-night-panel/95 p-2 text-xs text-night-fg shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold">{cam.place}</p><p className="text-night-muted">{cam.operator}</p></div>
        <button onClick={onClose} aria-label="Close camera" className="rounded p-1 hover:bg-night"><X className="size-4" /></button>
      </div>
      {broken ? <div className="mt-2 grid aspect-video place-items-center rounded bg-night text-night-muted">Camera not answering right now</div>
        : cam.loop ? <video key={cam.id + Math.floor(now / 300_000)} src={cam.loop} poster={camImageSrc(cam, now)} autoPlay muted loop playsInline onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />
        : <img src={camImageSrc(cam, now)} alt={`Camera view: ${cam.place}`} onError={() => setBroken(true)} className="mt-2 aspect-video w-full rounded bg-night object-cover" />}
      <p className="mt-2 text-night-muted">{cam.loop ? `Short video loop, updated about every ${cam.everyMin} minutes — not live video.` : `Still picture, updates about every ${cam.everyMin} minute${cam.everyMin === 1 ? "" : "s"}.`} Scene only — not a source of figures.</p>
      <p className="mt-1"><a href={src.licenceUrl} target="_blank" rel="noreferrer noopener" className="underline">{src.licence}</a></p>
    </aside>
  );
}
