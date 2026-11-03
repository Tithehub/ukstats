import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Minus, Plus, Square, X } from "lucide-react";
import { BroadcastPanel, type BulletinStat } from "@/components/globe/BroadcastPanel";
import type { OfficialWarning } from "@/lib/unrest";
import type { FeedItem } from "@/lib/video-feed";
import { bringToFront, canAdd, clampScreen, newScreen, parseStored, tidy, MAX_SCREENS, STORAGE_KEY, type NewsScreen } from "@/lib/news-screens";

export type BulletinData = { name: string; stats: BulletinStat[]; statSource: { name: string; url: string } | null; warnings: OfficialWarning[]; videos: FeedItem[] };

const WBTN = "inline-flex size-6 items-center justify-center rounded hover:bg-night/40";
const CTRL = "inline-flex min-h-9 items-center gap-1 rounded border border-night-line bg-night-panel/90 px-2 py-1 text-xs backdrop-blur hover:bg-night disabled:opacity-50";

/** Floating, draggable, resizable news screens layered over the globe. Phones get a swipeable strip instead. */
export function NewsScreens({ countries, bulletinFor, step, defaultCountry }: {
  countries: { key: string; name: string }[];
  bulletinFor: (key: string) => BulletinData;
  step: (key: string, dir: 1 | -1) => string | null;
  defaultCountry: string;
}) {
  const area = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<NewsScreen[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const size = () => { const r = area.current?.getBoundingClientRect(); return { w: r?.width ?? 1000, h: r?.height ?? 700 }; };

  useEffect(() => { setList(parseStored(localStorage.getItem(STORAGE_KEY))); setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }, [list, loaded]);
  useEffect(() => {
    const el = area.current; if (!el) return;
    const ro = new ResizeObserver(() => { const { w, h } = size(); setNarrow(w < 640); setList((l) => l.map((s) => clampScreen(s, w, h))); });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const update = (id: string, p: Partial<NewsScreen>) => setList((l) => l.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const add = () => setList((l) => { if (!canAdd(l)) return l; const { w, h } = size(); const c = l.length ? (step(l[l.length - 1]!.country, 1) ?? defaultCountry) : defaultCountry; return [...l, newScreen(l, c, w, h, `s${Date.now().toString(36)}`)]; });

  /** Pointer drag for move ("move") or bottom-right resize ("size"). */
  const drag = (e: React.PointerEvent, s: NewsScreen, mode: "move" | "size") => {
    if (e.button !== 0) return;
    if (mode === "move" && (e.target as HTMLElement).closest("button,a,select,input")) return;
    e.preventDefault();
    setList((l) => bringToFront(l, s.id));
    const sx = e.clientX, sy = e.clientY, start = { ...s };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy; const { w, h } = size();
      const next = mode === "move" ? { ...start, x: start.x + dx, y: start.y + dy } : { ...start, w: start.w + dx, h: start.h + dy };
      update(s.id, clampScreen(next, w, h));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const panel = (s: NewsScreen, winBtns: React.ReactNode, fill: boolean) => {
    const d = bulletinFor(s.country);
    return <BroadcastPanel {...d} fill={fill} header={winBtns}
      onNextCountry={() => { const n = step(s.country, 1); if (n) update(s.id, { country: n }); }}
      onPrevCountry={() => { const n = step(s.country, -1); if (n) update(s.id, { country: n }); }}
      onStop={() => setList((l) => l.filter((x) => x.id !== s.id))} />;
  };
  const picker = (s: NewsScreen) => <select aria-label="Screen country" value={s.country} onChange={(e) => update(s.id, { country: e.target.value })} className="h-6 max-w-24 rounded border border-desk-line bg-desk px-1 text-[10px] text-desk-fg">
    {!countries.some((c) => c.key === s.country) && <option value={s.country}>{s.country}</option>}
    {countries.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</select>;

  return <div ref={area} className="pointer-events-none absolute inset-0 z-20">
    <div className="pointer-events-auto absolute right-3 top-14 flex gap-1 sm:top-16">
      <button onClick={add} disabled={!canAdd(list)} className={CTRL} aria-label="Open a new news screen"><Plus className="size-3.5" />New screen{list.length ? ` (${list.length}/${MAX_SCREENS})` : ""}</button>
      {list.length > 1 && !narrow && <button onClick={() => { const { w, h } = size(); setList((l) => tidy(l, w, h)); }} className={CTRL} aria-label="Tidy screens"><LayoutGrid className="size-3.5" /><span className="max-md:sr-only">Tidy</span></button>}
    </div>

    {narrow ? list.length > 0 && <div className="pointer-events-auto absolute inset-x-2 top-28 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1" aria-label="News screens">
      {list.map((s) => <div key={s.id} className="w-[88%] shrink-0 snap-center">{panel(s, <>{picker(s)}<button aria-label="Close screen" className={WBTN} onClick={() => setList((l) => l.filter((x) => x.id !== s.id))}><X className="size-3.5" /></button></>, false)}</div>)}
    </div> : <>
      {list.filter((s) => !s.min).map((s) => <div key={s.id} role="dialog" aria-label={`News screen: ${bulletinFor(s.country).name}`}
        onPointerDown={() => setList((l) => bringToFront(l, s.id))}
        className="pointer-events-auto absolute touch-none" style={{ left: s.x, top: s.y, width: s.w, height: s.h, zIndex: s.z }}>
        <div className="h-full cursor-move" onPointerDown={(e) => { if ((e.target as HTMLElement).closest("[data-drag-handle]")) drag(e, s, "move"); }}>
          {panel(s, <span className="flex cursor-default items-center gap-0.5">{picker(s)}
            <button aria-label="Minimise screen" className={WBTN} onClick={() => update(s.id, { min: true })}><Minus className="size-3.5" /></button>
            <button aria-label="Close screen" className={WBTN} onClick={() => setList((l) => l.filter((x) => x.id !== s.id))}><X className="size-3.5" /></button></span>, true)}
        </div>
        <span aria-hidden="true" onPointerDown={(e) => { e.stopPropagation(); drag(e, s, "size"); }} className="absolute bottom-0 right-0 size-4 cursor-se-resize rounded-br-md" style={{ background: "linear-gradient(135deg, transparent 50%, var(--color-electric) 50%)" }} />
      </div>)}
      {list.some((s) => s.min) && <div className="pointer-events-auto absolute bottom-14 right-3 flex flex-wrap justify-end gap-1">
        {list.filter((s) => s.min).map((s) => <button key={s.id} onClick={() => { update(s.id, { min: false }); setList((l) => bringToFront(l, s.id)); }} className={CTRL}><Square className="size-3" />{bulletinFor(s.country).name}</button>)}
      </div>}
    </>}
  </div>;
}
