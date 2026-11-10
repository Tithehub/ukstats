// Right-hand panel for the hourly "About UKStats" explainer in the Orbit stream.
import { QRCodeSVG } from "qrcode.react";
import { explainerChapters, type Chapter } from "@/lib/stream-explainer";
import { REPORT_PRICES, gbp } from "@/lib/reports";
import { PRODUCT_PRICES, AI_PRESENTER_PENCE, gbp as rentGbp } from "@/lib/rent-pricing";
import sports from "@/assets/explainer-sports.jpg";
import ukCover from "@/assets/reports/uk-01.jpg";
import globalCover from "@/assets/reports/global-01.jpg";
import rentDash from "@/assets/rent/rent-dashboard.jpg";
import rentStream from "@/assets/rent/rent-stream.jpg";
import rentWidget from "@/assets/rent/rent-widget.jpg";

const QR = (path: string) => `https://ukstats.co.uk${path}${path.includes("?") ? "&" : "?"}ref=ukstats_stream`;

export function UkStatsMark({ size = 56 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
    <rect x="3" y="14" width="7" height="15" rx="1" className="fill-night-fg" />
    <rect x="12.5" y="3" width="7" height="26" rx="1" className="fill-night-fg" />
    <rect x="22" y="9" width="7" height="20" rx="1" className="fill-night-fg" />
  </svg>;
}
const Wordmark = ({ big }: { big?: boolean }) => <div className="flex items-center gap-3"><UkStatsMark size={big ? 72 : 44} /><span className={`${big ? "text-[64px]" : "text-[38px]"} leading-none tracking-tight`}><b className="font-black">UK</b>Stats</span></div>;

function Qr({ path, label }: { path: string; label: string }) {
  return <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg bg-background p-3 text-foreground">
    <QRCodeSVG value={QR(path)} size={150} level="M" marginSize={2} />
    <span className="font-mono text-[18px] font-bold">{label}</span>
  </div>;
}

const PUBLISHERS = ["ONS", "Home Office", "HM Treasury", "OBR", "Met Office", "UKHSA", "Eurostat", "World Bank", "IMF"];
const LAYERS = ["UK FCDO travel advice", "US State Dept levels", "Live flights · not official", "Migration routes", "News & police reports"];

export function OrbitExplainer({ chapter, index, line, msInChapter }: { chapter: Chapter; index: number; line: number; msInChapter: number }) {
  const all = explainerChapters();
  const p = Math.min(1, msInChapter / chapter.ms);
  return <div className="orbit-glass relative overflow-hidden rounded-xl border border-night-fg/15 p-6 shadow-2xl">
    <div className="flex items-center justify-between font-mono text-[18px] uppercase tracking-[0.25em] text-electric-soft">
      <span>About UKStats · {index + 1}/{all.length}</span><span>Not news · not statistics</span>
    </div>
    <h2 key={chapter.id} className="mt-2 text-[44px] font-black leading-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-6">{chapter.title}</h2>
    <div className="mt-3 h-[5px] overflow-hidden rounded bg-night-fg/10"><div className="h-full bg-destructive transition-[width] duration-300" style={{ width: `${p * 100}%` }} /></div>
    <div key={`${chapter.id}-body`} className="mt-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-700">{body(chapter, line)}</div>
  </div>;
}

function body(c: Chapter, line: number) {
  switch (c.id) {
    case "welcome": case "close": return <div className="flex items-center justify-between gap-6">
      <div className="flex flex-col gap-4"><Wordmark big /><p className="text-[28px] text-night-muted">{c.id === "welcome" ? "Official UK & world statistics. Always free." : "@ukstatsglobal · ukstats.co.uk"}</p></div>
      <Qr path="/" label="ukstats.co.uk" />
    </div>;
    case "globe": return <div className="flex items-end justify-between gap-6">
      <ul className="flex flex-col gap-3">{LAYERS.map((l, i) => <li key={l} className={`flex items-center gap-3 text-[26px] transition-opacity duration-500 ${i <= line + 1 ? "opacity-100" : "opacity-30"}`}><span className={`size-3 rounded-full ${i <= line + 1 ? "bg-destructive motion-safe:animate-pulse" : "bg-night-muted"}`} />{l}</li>)}</ul>
      <Qr path="/globe" label="/globe" />
    </div>;
    case "sources": return <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">{PUBLISHERS.map((n, i) => <div key={n} style={{ animationDelay: `${i * 120}ms` }} className="rounded-md border border-night-fg/15 bg-night/60 px-3 py-3 text-center text-[22px] font-bold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 fill-mode-backwards">{n}</div>)}</div>
      <div className="grid grid-cols-3 gap-3 font-mono text-[18px] uppercase tracking-widest">
        {["Source", "Reference date", "Next release"].map((x) => <div key={x} className="rounded border-l-4 border-electric bg-night/60 px-3 py-2">{x} ✓</div>)}
      </div>
    </div>;
    case "reports": return <div className="flex items-center gap-5">
      <div className="relative h-[250px] w-[300px] shrink-0">
        <img src={globalCover} alt="Global report cover" className="absolute right-0 top-0 h-[230px] rotate-6 rounded shadow-2xl" />
        <img src={ukCover} alt="UK report cover" className="absolute left-0 top-4 h-[230px] -rotate-3 rounded shadow-2xl motion-safe:animate-[orbit-head_6s_ease-in-out_infinite]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-[22px]">
        <Price k="UK daily" v={gbp(REPORT_PRICES.report_uk_daily.pence)} />
        <Price k="Global daily" v={gbp(REPORT_PRICES.report_global_daily.pence)} />
        <Price k="UK month / year" v={`${gbp(REPORT_PRICES.report_uk_monthly.pence)} / ${gbp(REPORT_PRICES.report_uk_yearly.pence)}`} />
        <Price k="Global month / year" v={`${gbp(REPORT_PRICES.report_global_monthly.pence)} / ${gbp(REPORT_PRICES.report_global_yearly.pence)}`} />
      </div>
    </div>;
    case "rent": {
      const shots = [rentDash, rentStream, rentWidget];
      return <div className="flex flex-col gap-4">
        <div className="relative h-[230px] overflow-hidden rounded-lg border border-night-fg/15">
          {shots.map((s, i) => <img key={s} src={s} alt="Rent UKStats example" className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-1000 ${i === line % shots.length ? "opacity-100" : "opacity-0"}`} />)}
        </div>
        <div className="flex items-center justify-between gap-4 text-[22px]">
          <div className="flex flex-col gap-1">
            <Price k="Widgets" v={`${rentGbp(PRODUCT_PRICES.widgets.pence)}/mo`} />
            <Price k="Dashboard" v={`${rentGbp(PRODUCT_PRICES.dashboard.pence)}/mo`} />
            <Price k="Stream · AI presenter" v={`${rentGbp(PRODUCT_PRICES.stream.pence)} + ${rentGbp(AI_PRESENTER_PENCE)}/mo`} />
          </div>
          <Qr path="/rent" label="/rent" />
        </div>
      </div>;
    }
    case "sports": return <div className="relative h-[380px] overflow-hidden rounded-lg">
      <img src={sports} alt="Multi-sport montage" width={1920} height={1088} className="size-full object-cover motion-safe:animate-[orbit-head_12s_ease-in-out_infinite] scale-110" />
      <div className="absolute left-4 top-4 rounded-lg bg-night/70 px-4 py-3 backdrop-blur"><Wordmark /></div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night to-transparent px-5 pb-4 pt-16">
        <div className="font-mono text-[20px] uppercase tracking-[0.3em] text-destructive">Coming soon</div>
        <div className="text-[34px] font-black">Sports data, stats &amp; free games</div>
      </div>
    </div>;
  }
}

const Price = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-4 border-b border-night-fg/10 pb-1"><span className="text-night-muted">{k}</span><span className="font-mono font-bold tabular-nums">{v}</span></div>;
