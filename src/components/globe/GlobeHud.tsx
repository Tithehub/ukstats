import { useEffect, useState } from "react";
import { Crosshair, Globe2, Mountain } from "lucide-react";

const fmt = (d: Date, tz: string) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: tz });
const deg = (v: number | null, pos: string, neg: string) => (v === null ? "—" : `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`);

/** Control-room readout: clocks, pointer position, camera height and camera presets. */
export function GlobeHud({ tele, onPreset, canFocus }: { tele: { lat: number | null; lng: number | null; altKm: number }; onPreset: (k: "world" | "tilt" | "focus") => void; canFocus: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const btn = "inline-flex min-h-8 items-center gap-1 rounded border border-night-line bg-night-panel/70 px-2 backdrop-blur hover:bg-night disabled:opacity-40";
  return <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden flex-col-reverse items-end gap-2 font-mono text-[11px] text-night-fg sm:flex">
    <div className="rounded-md border border-night-line bg-night-panel/60 px-3 py-2 text-right backdrop-blur" aria-label="Clocks and position">
      <p><span className="text-night-muted">UTC</span> {now ? fmt(now, "UTC") : "--:--:--"} · <span className="text-night-muted">LDN</span> {now ? fmt(now, "Europe/London") : "--:--:--"}</p>
      <p className="mt-0.5"><span className="text-night-muted">POS</span> {deg(tele.lat, "N", "S")} {deg(tele.lng, "E", "W")}</p>
      <p className="mt-0.5"><span className="text-night-muted">CAM</span> {tele.altKm.toLocaleString("en-GB")} km</p>
    </div>
    <div className="pointer-events-auto flex gap-1" aria-label="Camera views">
      <button type="button" className={btn} onClick={() => onPreset("world")}><Globe2 className="size-3.5" />Whole world</button>
      <button type="button" className={btn} onClick={() => onPreset("tilt")}><Mountain className="size-3.5" />Tilted</button>
      <button type="button" className={btn} disabled={!canFocus} title={canFocus ? undefined : "Pick a country first"} onClick={() => onPreset("focus")}><Crosshair className="size-3.5" />Focus</button>
    </div>
  </div>;
}
