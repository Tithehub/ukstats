import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startStreamAudio, type StreamAudio } from "@/lib/stream-audio";
import { GlobeExplorer, type GlobeState } from "@/components/globe/GlobeExplorer";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { getUkStats } from "@/lib/uk-stats.functions";
import { newsReportsQuery } from "@/lib/news-reports.functions";
import { flightsQuery } from "@/lib/flights.functions";
import { countryQuery } from "@/lib/country-queries";
import { COUNTRIES } from "@/lib/countries";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type StatsPayload } from "@/lib/uk-stats";
import { clipCaption, clipsForCard } from "@/lib/stream-clips";
import { cameraCaption, cameraForCard, cameraSrc } from "@/lib/stream-cameras";
import { STREAM_CAMERAS } from "@/lib/stream-cameras.data";
import { STREAM_CLIPS } from "@/lib/stream-clips.data";
import { buildRundown, countrySegment, statsTicker, type Segment, type StreamCard, type Headline } from "@/lib/stream-rundown";
import { QRCodeSVG } from "qrcode.react";
import { Presenter } from "@/components/stream/Presenter";
import { scriptForCard } from "@/lib/stream-script";
import { getSponsorBannerBoard } from "@/lib/banner.functions";
import { readPaymentsEnvironment } from "@/lib/payments-env";
import { regionFromPath, sponsorsForRegion, type SponsorBannerRow } from "@/lib/sponsor-visibility";
import { topSix, type TopBox } from "@/lib/stream-extras";
import { smallBoatsQuery } from "@/lib/small-boats.functions";
import { boatsYearMetric, countdown, justPublished, upcomingReleases } from "@/lib/stream-extras";
import { buildUkHour, cardStep, positionAt, ukSlotAt, worldCountryAt } from "@/lib/stream-schedule";

const statsQuery = { queryKey: ["uk-stats"], queryFn: () => getUkStats() as Promise<StatsPayload>, staleTime: 5 * 60_000, refetchInterval: 15 * 60_000 };
const WORLD = COUNTRIES.map((c) => ({ code: c.code, key: c.name.toLowerCase() }));

type Layout = "landscape" | "portrait";

/** TV news-channel page captured by an external streamer (ffmpeg / OBS) for YouTube Live. */
export const Route = createFileRoute("/globe_/broadcast")({
  validateSearch: (s: Record<string, unknown>): { layout?: Layout } => (s["layout"] === "portrait" ? { layout: "portrait" } : {}),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(worldQuery()),
    context.queryClient.ensureQueryData(unrestQuery()),
    context.queryClient.ensureQueryData(statsQuery).catch(() => null),
  ]),
  head: () => ({ meta: [
    { title: "UKStats Live — news channel broadcast" },
    { name: "description", content: "UKStats Live: official UK figures, government warnings, flights, small boats and news reports, each dated and sourced." },
    { property: "og:title", content: "UKStats Live — news channel broadcast" },
    { property: "og:description", content: "Official UK statistics and world warnings as a live news channel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: BroadcastPage,
});

const RELOAD_MS = 4 * 60 * 60_000;
const london = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Europe/London", ...o });
const hhmm = (iso: string | null) => iso ? london(new Date(iso), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
const FRESH: Record<string, string> = { fresh: "bg-fresh", ageing: "bg-ageing", overdue: "bg-overdue", unknown: "bg-night-muted" };

function BroadcastPage() {
  const layout: Layout = Route.useSearch().layout ?? "landscape";
  const W = layout === "portrait" ? 1080 : 1920, H = layout === "portrait" ? 1920 : 1080;
  const [s, setS] = useState<GlobeState>({ ind: "none", official: true, acled: false, c: "united kingdom", fl: true, mg: true, nw: true } as GlobeState);
  const onChange = useCallback((p: Partial<GlobeState>) => setS((o) => ({ ...o, ...p })), []);
  const { data: stats } = useQuery(statsQuery);
  const { data: unrest } = useQuery(unrestQuery());
  const { data: news } = useQuery(newsReportsQuery(true));
  const { data: flights } = useQuery(flightsQuery(true));
  const [now, setNow] = useState<Date | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); setScale(k); setOffset({ x: (innerWidth - W * k) / 2, y: (innerHeight - H * k) / 2 }); };
    fit(); addEventListener("resize", fit);
    const ro = new ResizeObserver(fit); ro.observe(document.documentElement);
    const late = setTimeout(fit, 1500);
    // Report any text running past its box to the studio preview.
    const chk = setInterval(() => {
      const bad = [...document.querySelectorAll<HTMLElement>("[data-fit]")].some((el) => el.scrollHeight > el.clientHeight + 1);
      if (parent !== window) parent.postMessage({ type: "ukstats-stream-fit", ok: !bad }, location.origin);
    }, 3000);
    return () => { removeEventListener("resize", fit); ro.disconnect(); clearTimeout(late); clearInterval(chk); };
  }, [W, H]);

  useEffect(() => {
    setNow(new Date());
    const c = setInterval(() => setNow(new Date()), 1000);
    // Watchdog: reload every few hours, and soon after any uncaught error, so the stream never freezes.
    const r = setTimeout(() => location.reload(), RELOAD_MS);
    const onErr = () => setTimeout(() => location.reload(), 60_000);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => { clearInterval(c); clearTimeout(r); window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); };
  }, []);

  const { data: boatsData } = useQuery(smallBoatsQuery());
  const { data: sponsorRows } = useQuery({
    queryKey: ["stream-sponsors"], refetchInterval: 15 * 60_000, staleTime: 15 * 60_000,
    queryFn: async () => (await getSponsorBannerBoard({ data: { environment: readPaymentsEnvironment() ?? "sandbox" } })).sponsors,
  });
  const sponsors = useMemo(() => sponsorsForRegion(sponsorRows ?? [], regionFromPath("/", COUNTRIES.map((c) => c.code))), [sponsorRows]);
  const { data: worldData } = useQuery(worldQuery());
  const metrics = stats?.metrics ?? [];
  const emergency = flights?.planes ? flights.planes.filter((p) => p[7] === "7500" || p[7] === "7600" || p[7] === "7700").length : null;
  const tenMin = now ? Math.floor(now.getTime() / 600_000) : 0;
  const rundown = useMemo(() => buildRundown({
    metrics, warnings: unrest?.warnings ?? [], reports: news?.items ?? [], emergencyPlanes: emergency, now: now ?? new Date(0),
  }), [metrics, unrest, news, emergency, tenMin]);
  const ukHour = useMemo(() => buildUkHour(rundown), [rundown]);

  // Clock-driven position: even London hours = UK hour, odd hours = other countries five minutes each.
  const pos = now ? positionAt(now) : { mode: "uk" as const, hourIndex: 0, msIntoHour: 0 };
  const world = pos.mode === "world" ? worldCountryAt(WORLD.map((w) => w.key), pos) : null;
  const wc = world ? WORLD[world.index]! : null;
  const { data: countryData } = useQuery({ ...countryQuery(wc?.code ?? "fr"), enabled: !!wc });
  useQuery({ ...countryQuery(world ? WORLD[world.next]!.code : "fr"), enabled: !!world });

  let seg: Segment | undefined; let msIn = 0; let upNext: string[] = [];
  if (wc && world) {
    seg = countrySegment(wc.key, countryData, unrest?.warnings ?? [], now ?? new Date(0));
    msIn = world.msIntoSlot;
    upNext = [1, 2, 3].map((i) => COUNTRIES[(world.index + i) % COUNTRIES.length]!.name);
    if (60 - Math.floor(pos.msIntoHour / 60_000) <= 15) upNext = [...upNext.slice(0, 2), "UK hour at the top of the hour"];
  } else if (ukHour.length) {
    const at = ukSlotAt(ukHour, pos.msIntoHour);
    seg = ukHour[at.index]!.seg; msIn = at.msIntoSlot;
    upNext = [1, 2, 3].map((i) => ukHour[at.index + i]?.seg.title).filter((x): x is string => !!x);
    if (upNext.length < 3) upNext.push("Around the world — other countries");
  }
  const step = cardStep(msIn);
  const card = seg?.cards.length ? seg.cards[step % seg.cards.length]! : null;
  const head = seg?.headlines.length ? seg.headlines[step % seg.headlines.length]! : null;

  const audio = useRef<StreamAudio | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sound") !== "on") return;
    audio.current = startStreamAudio();
    return () => { audio.current?.stop(); audio.current = null; };
  }, []);
  useEffect(() => { if (seg?.id) audio.current?.sting(); }, [seg?.id]);
  useEffect(() => { if (seg) setS((o) => ({ ...o, c: seg.country, ...seg.layers, fl: seg.layers.fl || o.fl })); }, [seg?.id]);

  const latest = [
    ...(unrest?.warnings ?? []).filter((w) => w.mentionsUnrest).slice(0, 8).map((w) => `${w.source} · ${w.country}: ${w.text}`),
    ...(news?.items ?? []).slice(0, 8).map((r) => `${r.publisher}: ${r.title}`),
  ];
  const keyStats = statsTicker(metrics);
  const clock = now ? `${london(now, { weekday: "short", day: "numeric", month: "short" })} · ${london(now, { hour: "2-digit", minute: "2-digit" })}` : "";
  const region = wc ? "AROUND THE WORLD" : "UK HOUR";

  const iso3 = (() => { const code = wc ? wc.code.toUpperCase() : "GB"; return worldData?.countries.find((c) => c.iso2 === code)?.iso3 ?? null; })();
  const six = <TopSix boxes={topSix(worldData, iso3, boatsData, !wc)} name={wc ? COUNTRIES[world!.index]!.name : "United Kingdom"} />;
  const header = <Header seg={seg} clock={clock} region={region} portrait={layout === "portrait"} />;
  const figure = <FigureCard card={card} segId={seg?.id} big={!!seg?.headline} compact />;
  const clip = <ClipBox topic={seg?.topic ?? ""} country={seg?.country} title={card?.title ?? ""} />;
  const [voice, setVoice] = useState(false);
  useEffect(() => { setVoice(new URLSearchParams(window.location.search).get("voice") !== "off"); }, []);
  // Reload when a new version is published, so OBS picks it up without a manual refresh.
  useEffect(() => {
    const pick = (html: string) => html.match(/\/assets\/[\w.-]+\.js/g)?.sort().join("|") ?? "";
    const mine = pick(document.documentElement.outerHTML);
    if (!mine) return;
    const id = setInterval(() => {
      fetch(window.location.pathname, { cache: "no-store" }).then((r) => r.text()).then((h) => { const v = pick(h); if (v && v !== mine) window.location.reload(); }).catch(() => {});
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, []);
  const anchor = <Presenter line={scriptForCard(card)} upcoming={seg?.cards.length ? [1, 2, 3].map((i) => scriptForCard(seg!.cards[(step + i) % seg!.cards.length]!)) : []} voice={voice} />;
  const lower = head ? <LowerThird head={head} /> : null;
  const next = upNext.length ? <UpNext items={upNext} /> : null;
  const t = now ?? new Date(0);
  // UK register figures only belong on screen during the UK hour.
  const newest = wc ? [] : justPublished(metrics, t);
  const freshItem = newest.length ? newest[cardStep(pos.msIntoHour) % newest.length]! : null;
  const fresh = freshItem ? <div key={freshItem.id} className="flex shrink-0 items-center gap-4 overflow-hidden rounded bg-destructive px-4 py-2 text-destructive-foreground motion-safe:animate-in motion-safe:fade-in">
    <span className="shrink-0 font-mono text-[22px] font-black tracking-widest">JUST PUBLISHED</span>
    <span className="min-w-0 truncate text-[24px] font-semibold">{freshItem.title}: {freshItem.value} · {freshItem.source}</span>
  </div> : null;
  const next4 = upcomingReleases(metrics, t, layout === "portrait" ? 3 : 1);
  const releases = next4.length ? <div className="shrink-0 rounded border-2 border-night-line bg-night px-4 py-2">
    <div className="font-mono text-[20px] font-bold uppercase tracking-widest text-electric">Next official releases</div>
    {next4.map((m) => <div key={m.id} className="flex justify-between gap-4 text-[22px]"><span className="truncate">{m.title}</span><span className="shrink-0 font-mono tabular-nums">in {countdown(m.nextDue!, t)}</span></div>)}
  </div> : null;
  const boats = !wc ? boatsYearMetric(metrics) : null;
  const boatsChip = boats ? <div className="rounded border-2 border-destructive bg-night-panel px-4 py-2">
    <div className="truncate font-mono text-[20px] font-bold uppercase tracking-widest text-destructive">{boats.title}</div>
    <div className="flex items-baseline gap-3"><span className="text-[48px] font-black leading-none tabular-nums">{boats.value}</span><span className="truncate text-[20px] text-night-muted">{boats.period ?? ""} · Home Office</span></div>
  </div> : null;
  const qr = <div className="flex flex-col items-center gap-1 rounded bg-background p-2 text-foreground">
    <QRCodeSVG value="https://ukstats.co.uk/?utm_source=youtube&utm_medium=social" size={140} />
    <span className="font-mono text-[18px] font-bold">ukstats.co.uk</span>
  </div>;
  const tickers = <div className="overflow-hidden border-t-2 border-night-line">
    <Ticker label="LATEST" items={latest} cls="bg-destructive text-destructive-foreground" speed={90} />
    <Ticker label="UK STATS" items={keyStats} cls="bg-primary text-primary-foreground" speed={140} />
  </div>;

  return <div className="fixed inset-0 overflow-hidden bg-night">
  <div data-frame data-layout={layout} className="absolute left-0 top-0 origin-top-left overflow-hidden bg-night font-sans text-night-fg"
    style={{ width: W, height: H, transform: `scale(${scale})`, left: offset.x, top: offset.y }}>
    {layout === "landscape" ? <>
      {/* Globe fills the left; YouTube's title and control zones (top 96px, bottom 120px) show only globe/background */}
      <div className="absolute inset-y-0 left-0 w-[1240px]"><GlobeExplorer state={s} onChange={onChange} broadcast /></div>
      <div className="absolute inset-x-0 top-[96px] z-40 h-[96px]">{header}</div>
      <div className="absolute left-6 top-[212px] z-30 w-[520px]">{next}</div>
      <aside data-fit className={`absolute right-0 top-[192px] z-30 flex h-[664px] w-[680px] flex-col gap-4 overflow-hidden border-l-2 border-night-line bg-night-panel p-5`}>
        {six}
        {fresh}
        <div className="min-h-0 flex-1">{figure}</div>
      </aside>
      <div className="absolute left-[620px] top-[222px] z-30 h-[450px] w-[420px]">{anchor}</div>
      <div className="absolute left-[1056px] top-[212px] z-30">{qr}</div>
      {boatsChip && <div className="absolute left-[560px] top-[212px] z-30 w-[480px]">{boatsChip}</div>}
      <div className="absolute bottom-[232px] left-6 z-30 w-[540px]">{clip}</div>
      <div className="absolute bottom-[240px] left-[590px] z-30 w-[620px]">{lower}</div>
      <div className={`absolute bottom-[120px] left-0 z-40 h-[104px] ${sponsors.length ? "right-[440px]" : "right-0"}`}>{tickers}</div>
      {sponsors.length > 0 && <div className="absolute bottom-[120px] right-[24px] z-40 h-[104px] w-[416px]"><StreamSponsors rows={sponsors} ms={pos.msIntoHour} /></div>}
    </> : <>
      <div className="absolute inset-x-0 top-[120px] z-40 h-[140px]">{header}</div>
      <div className="absolute inset-x-0 top-[260px] h-[500px]"><GlobeExplorer state={s} onChange={onChange} broadcast /></div>
      <div className="absolute left-6 top-[280px] z-30 w-[520px]">{next}</div>
      <div className="absolute right-6 top-[280px] z-30 h-[310px] w-[300px]">{anchor}</div>
      <div className="absolute inset-x-6 top-[600px] z-30">{lower}</div>
      <aside data-fit className="absolute inset-x-0 top-[770px] z-30 flex h-[640px] flex-col gap-2 overflow-hidden border-y-2 border-night-line bg-night-panel px-6 py-4">{six}{fresh}<div className="min-h-0 flex-1 overflow-hidden">{figure}</div></aside>
      <div className="absolute right-6 top-[1420px] z-30">{qr}</div>
      {sponsors.length > 0 && <div className="absolute right-[196px] top-[1420px] z-30 h-[104px] w-[416px]"><StreamSponsors rows={sponsors} ms={pos.msIntoHour} /></div>}
            <div className="absolute left-6 top-[1416px] z-30 w-[360px]">{clip}</div>
      <div className="absolute inset-x-0 bottom-[120px] z-40 h-[104px]">{tickers}</div>
    </>}
  </div></div>;
}

function Header({ seg, clock, region, portrait }: { seg: Segment | undefined; clock: string; region: string; portrait: boolean }) {
  const major = !!seg?.headline;
  return <header className={`flex h-full items-stretch overflow-hidden border-y-2 border-night-line ${major ? "bg-destructive text-destructive-foreground" : "bg-stream-strap text-stream-strap-fg"} ${portrait ? "flex-wrap" : ""}`}>
    <div className="flex items-center gap-3 bg-primary px-6 text-primary-foreground">
      <span className="text-[44px] font-black tracking-tight">UKSTATS</span>
      <span className="rounded bg-destructive px-2 py-0.5 text-[24px] font-bold text-destructive-foreground">● LIVE</span>
    </div>
    <div data-fit key={seg?.id} className={`flex min-w-0 flex-1 flex-col justify-center overflow-hidden px-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 `}>
      <span className={`font-mono text-[22px] font-bold uppercase tracking-widest ${major ? "" : "text-destructive"}`}>{major ? "Major issue" : region}</span>
      <span className={`font-black uppercase leading-tight tracking-tight ${portrait ? "line-clamp-2 text-[34px]" : "truncate text-[40px]"}`}>{seg?.title ?? "Official UK statistics"}</span>
    </div>
    <div className={`flex items-center px-6 font-mono text-[26px] ${portrait ? "hidden" : ""}`}>{clock} <span className="ml-2 text-[20px] opacity-80">London</span></div>
  </header>;
}

function FigureCard({ card, segId, big, compact }: { card: StreamCard | null; segId: string | undefined; big: boolean; compact: boolean }) {
  if (!card) return <section className="rounded border-2 border-night-line bg-night p-6 text-[26px] leading-snug text-night-muted">Every figure on UKStats comes from the official publisher, with its date and next release. No figure is published for this item.</section>;
  const meta = (k: string, v: string) => <><dt className="text-night-muted">{k}</dt><dd className="truncate">{v}</dd></>;
  return <section key={`${segId}-${card.title}`} className="flex h-full flex-col rounded border-2 border-night-line bg-night p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4">
    <div className="mb-2 flex items-center gap-3 font-mono text-[22px] font-bold uppercase tracking-widest text-electric">
      {card.metric && <span className={`inline-block size-4 rounded-full ${FRESH[freshnessOf(card.metric)]}`} />}{card.kicker}
    </div>
    <h2 className={`shrink-0 font-bold leading-tight ${compact ? "truncate text-[30px]" : "line-clamp-2 text-[34px]"}`} >{card.title}</h2>
    <div className={`my-3 shrink-0 self-start truncate rounded bg-stream-yellow px-3 py-1 text-stream-yellow-fg font-black leading-none tabular-nums ${compact ? "text-[72px]" : big ? "text-[120px]" : "text-[100px]"}`}>{card.value}</div>
    {card.sub && !compact && <p className="line-clamp-2 text-[24px] leading-snug text-night-muted">{card.sub}</p>}
    <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[22px]">
      {meta("Source", card.source)}
      {card.period && !compact && meta("Period", card.period)}
      {card.asOf && meta(card.live ? "Read" : "Published", card.live ? hhmm(card.asOf) : `${fmtDate(card.asOf)} · ${ageLabel(card.asOf)}`)}
      {!card.live && !compact && meta("Next", card.nextDue ? `${fmtDate(card.nextDue)} · ${dueLabel(card.nextDue)}` : "Not announced")}
    </dl>
  </section>;
}

function LowerThird({ head }: { head: Headline }) {
  return <div key={head.text} className="overflow-hidden rounded border-2 border-night-line bg-night-panel motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
    <div className={`px-4 py-1 font-mono text-[22px] font-bold uppercase ${head.official ? "bg-destructive text-destructive-foreground" : "bg-electric text-night"}`}>{head.official ? "Official warning" : "News report — not official"}</div>
    <p className="line-clamp-2 max-h-[84px] px-4 pt-2 text-[30px] font-semibold leading-[42px]">{head.text}</p>
    <p className="truncate px-4 pb-2 font-mono text-[22px] text-night-muted">{head.publisher}{head.time ? ` · ${hhmm(head.time)} London` : ""}</p>
  </div>;
}

function TopSix({ boxes, name }: { boxes: TopBox[]; name: string }) {
  return <section aria-label={`Top 6 figures for ${name}`} className="shrink-0">
    <div className="mb-1 truncate font-mono text-[20px] font-bold uppercase tracking-widest text-electric">Top 6 · {name} <span className="normal-case tracking-normal text-night-muted">· World Bank &amp; Home Office</span></div>
    <div className="grid grid-cols-3 gap-2">{boxes.map((b) => <div key={b.id} className={`min-w-0 rounded border-2 px-3 py-1.5 ${b.migration ? "border-destructive bg-destructive/15" : "border-night-line bg-night"}`}>
      <div className={`truncate text-[20px] font-semibold ${b.migration ? "text-destructive" : "text-night-muted"}`}>{b.label}</div>
      {b.value ? <div className="truncate text-[32px] font-black leading-tight tabular-nums">{b.value}</div> : <div className="text-[24px] font-black leading-[38px]">Not published</div>}
      <div className="truncate font-mono text-[18px] text-night-muted">{b.when ?? b.source}</div>
    </div>)}</div>
  </section>;
}

function UpNext({ items }: { items: string[] }) {
  return <section className="rounded border-2 border-night-line bg-night-panel px-4 py-3">
    <h3 className="font-mono text-[22px] font-bold uppercase tracking-widest text-electric">Up next</h3>
    <ol className="mt-1 space-y-0.5 text-[24px]">{items.map((u) => <li key={u} className="truncate">▸ {u}</li>)}</ol>
  </section>;
}

function ClipBox({ topic, country, title }: { topic: string; country: string | undefined; title: string }) {
  const clips = useMemo(() => clipsForCard(title, topic, STREAM_CLIPS, country), [title, topic, country]);
  const first = clips[0]?.id;
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [first]);
  const [failed, setFailed] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => { setTick(Date.now()); const t = setInterval(() => setTick(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const cam = useMemo(() => cameraForCard(title.toLowerCase(), country, STREAM_CAMERAS, failed), [title, country, failed]);
  if (cam) {
    const mins = Math.floor((tick % (cam.refreshSeconds * 1000)) / 60_000);
    return <section className="overflow-hidden rounded border-2 border-night-line bg-night">
      <div className="relative aspect-video bg-night-panel">
        {tick > 0 && <video key={cameraSrc(cam, tick)} src={cameraSrc(cam, tick)} poster={cam.imageUrl} autoPlay muted loop playsInline
          onError={() => setFailed((f) => [...f, cam.id])} className="absolute inset-0 size-full object-cover" />}
        <span className="absolute left-3 top-3 rounded bg-destructive px-2 py-0.5 font-mono text-[20px] font-bold uppercase tracking-widest text-destructive-foreground">● Live camera</span>
        <span className="absolute right-3 top-3 rounded bg-night px-2 py-0.5 font-mono text-[18px]">{tick > 0 ? `updated ${mins} min ago` : "connecting…"}</span>
      </div>
      <p className="truncate px-3 pt-1.5 text-[22px] font-semibold">{cam.place}</p>
      <p className="truncate px-3 pb-1.5 font-mono text-[18px] text-night-muted">{cameraCaption(cam)} · {cam.licence}</p>
    </section>;
  }
  // Clip restarts only when the best match for the new figure changes (effect above).
  const c = clips.length ? clips[i % clips.length]! : null;
  return <section className="overflow-hidden rounded border-2 border-night-line bg-night">
    <div className="relative aspect-video bg-night-panel">
      {c ? <video key={c.id} src={c.url} autoPlay muted playsInline onEnded={() => setI((x) => x + 1)} className="absolute inset-0 size-full object-cover" />
        : <div className="absolute inset-0 grid place-items-center p-6 text-center text-[24px] text-night-muted">No licensed footage for this topic — figures shown are from the official publisher.</div>}
      {c && <span className="absolute left-3 top-3 rounded bg-night px-2 py-0.5 font-mono text-[20px] font-bold uppercase tracking-widest">{`Recorded footage · ${c.published.slice(0, 4)}`}</span>}
    </div>
    {c && <p className="truncate px-3 pt-1.5 text-[22px] font-semibold">{c.description}</p>}
    {c && <p className="truncate px-3 pb-1.5 font-mono text-[18px] text-night-muted">{clipCaption(c)}</p>}
  </section>;
}

function Ticker({ label, items, cls, speed }: { label: string; items: string[]; cls: string; speed: number }) {
  if (!items.length) return <div className="h-[52px] bg-night-panel" />;
  const text = items.join("   •   ");
  return <div className={`flex h-[52px] items-center overflow-hidden ${cls}`}>
    <span className="z-10 flex h-full shrink-0 items-center bg-stream-strap px-4 font-mono text-[24px] font-black text-stream-strap-fg">{label}</span>
    <div className="relative flex-1 overflow-hidden">
      <div className="inline-block whitespace-nowrap pl-[100%] text-[30px] font-bold motion-safe:animate-[stream-ticker_linear_infinite]" style={{ animationDuration: `${Math.max(40, text.length / 5) * (speed / 100)}s` }}>{text}</div>
    </div>
  </div>;
}

/** Paid placement: approved sponsors only, rotating ~10s each, kept apart from figures. */
function StreamSponsors({ rows, ms }: { rows: SponsorBannerRow[]; ms: number }) {
  const r = rows[Math.floor(ms / 10_000) % rows.length]!;
  const img = r.banner_link ?? (r.banner_path ? null : r.banner_url);
  return <section data-fit className="flex h-full overflow-hidden border-2 border-night-line bg-stream-strap text-stream-strap-fg">
    <div className="flex w-[100px] shrink-0 flex-col justify-center px-2 font-mono text-[14px] font-black uppercase leading-tight tracking-widest">Supported<br />by<span className="mt-1 truncate font-sans text-[14px] normal-case tracking-normal">{r.name}</span></div>
    {img ? <img key={r.id} src={img} alt={r.name} className="h-full min-w-0 flex-1 object-contain motion-safe:animate-in motion-safe:fade-in" />
      : <div key={r.id} className="grid h-full min-w-0 flex-1 place-items-center overflow-hidden bg-night px-2 text-center text-[18px] font-black text-night-fg">{r.name}</div>}
    <SponsorQr className="h-full shrink-0 border-l-2 border-night-line p-1.5" />
  </section>;
}

const SPONSOR_QR_URL = "https://ukstats.co.uk/sponsors?utm_source=youtube&utm_medium=stream_sponsor";

/** Scan-to-sponsors tile; links to the public sponsors page, never checkout. */
function SponsorQr({ className = "", big = false }: { className?: string; big?: boolean }) {
  return <div className={`flex items-center gap-2 bg-stream-strap text-stream-strap-fg ${className}`}>
    <QRCodeSVG value={SPONSOR_QR_URL} level="M" marginSize={1} className={big ? "h-[150px] w-[150px]" : "aspect-square h-full w-auto"} aria-label="QR code to ukstats.co.uk/sponsors" />
    <div className="font-mono text-[13px] font-black uppercase leading-tight">Scan to see<br />our sponsors<span className="mt-1 block font-sans text-[12px] normal-case">ukstats.co.uk/sponsors</span></div>
  </div>;
}

