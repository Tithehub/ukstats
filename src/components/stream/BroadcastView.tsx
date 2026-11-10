import { FEATURED_STORY } from "@/lib/featured-story.data";
import type { StreamBrand } from "@/components/stream/stream-brand";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
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
import bookCover from "@/assets/grooming-gang-cover-up-flat.png.asset.json";
import sp_gopharma from "@/assets/stream-pictures/gopharma.jpg.asset.json";
import sp_rareitup from "@/assets/stream-pictures/rareitup.jpg.asset.json";
import sp_goldlive from "@/assets/stream-pictures/goldlive.jpg.asset.json";
import sp_xpre from "@/assets/stream-pictures/xpre.jpg.asset.json";
import sp_yachtfino from "@/assets/stream-pictures/yachtfino.jpg.asset.json";
import bookStream from "@/assets/grooming-gang-cover-up-stream-4x3-v2.jpg.asset.json";
import { Presenter } from "@/components/stream/Presenter";
import { OrbitPresenter } from "@/components/stream/OrbitPresenter";
import { OrbitHeroCard, OrbitLowerThird, OrbitMiniTiles, OrbitNextUp, OrbitPulse, OrbitTicker } from "@/components/stream/OrbitScene";
import { sceneFor } from "@/lib/stream-orbit";
import { OrbitBackdrop } from "@/components/stream/OrbitBackdrop";
import { OrbitStatsRail } from "@/components/stream/OrbitStatsRail";
import { checkedLabel, keyFigures } from "@/lib/stream-extras";
import { scriptForCard, readingList, scriptForPromo } from "@/lib/stream-script";
import { itemForSpoken } from "@/lib/stream-sync";
import { getSponsorBannerBoard } from "@/lib/banner.functions";
import { readPaymentsEnvironment } from "@/lib/payments-env";
import { regionFromPath, sponsorsForRegion, type SponsorBannerRow } from "@/lib/sponsor-visibility";
import { topSix, type TopBox } from "@/lib/stream-extras";
import { smallBoatsQuery } from "@/lib/small-boats.functions";
import { boatsYearMetric, countdown, justPublished, upcomingReleases } from "@/lib/stream-extras";
import { buildUkHour, cardStep, positionAt, promoAt, PROMO_MS, ukSlotAt, worldCountryAt } from "@/lib/stream-schedule";

export const statsQuery = { queryKey: ["uk-stats"], queryFn: () => getUkStats() as Promise<StatsPayload>, staleTime: 5 * 60_000, refetchInterval: 15 * 60_000 };
const ALL_WORLD = COUNTRIES.map((c) => ({ code: c.code, key: c.name.toLowerCase() }));
const OrbitGlobe = lazy(() => import("@/components/stream/OrbitGlobe"));

export type Layout = "landscape" | "portrait";

const RELOAD_MS = 4 * 60 * 60_000;
const london = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Europe/London", ...o });
const hhmm = (iso: string | null) => iso ? london(new Date(iso), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
const FRESH: Record<string, string> = { fresh: "bg-fresh", ageing: "bg-ageing", overdue: "bg-overdue", unknown: "bg-night-muted" };

/** TV news-channel frame captured by OBS. `brand` turns it into a rented, customer-branded channel (figures unchanged). */
export type Variant = "classic" | "split" | "data-wall" | "orbit";
const VARIANTS: Record<Exclude<Variant, "classic">, { globe: number }> = { split: { globe: 960 }, "data-wall": { globe: 840 }, orbit: { globe: 1920 } };

export function BroadcastView({ layout, brand, variant = "classic", watermark }: { layout: Layout; brand?: StreamBrand; variant?: Variant; watermark?: string | undefined }) {
  const V = variant === "classic" ? { globe: 1240 } : VARIANTS[variant];
  const WORLD = useMemo(() => brand ? ALL_WORLD.filter((w) => brand.countries.includes(w.code)) : ALL_WORLD, [brand]);
  const hasUk = !brand || brand.countries.includes("gb");
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
    // Dev-only: a recorder can shift the stream clock (window.__streamOffset ms) to step through segments.
    const clockNow = () => new Date(Date.now() + (import.meta.env.DEV ? Number((window as unknown as { __streamOffset?: number }).__streamOffset ?? 0) : 0));
    setNow(clockNow());
    const c = setInterval(() => setNow(clockNow()), import.meta.env.DEV ? 250 : 1000);
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
  const sponsors = useMemo(() => brand && !brand.showSponsors ? [] : sponsorsForRegion(sponsorRows ?? [], regionFromPath("/", COUNTRIES.map((c) => c.code))), [sponsorRows, brand]);
  const slides = useMemo<CornerSlide[]>(() => [...sponsors.map(sponsorSlide), ...(brand ? [] : RECOMMENDED_SLIDES)], [sponsors, brand]);
  const { data: worldData } = useQuery(worldQuery());
  const metrics = stats?.metrics ?? [];
  const emergency = flights?.planes ? flights.planes.filter((p) => p[7] === "7500" || p[7] === "7600" || p[7] === "7700").length : null;
  const tenMin = now ? Math.floor(now.getTime() / 600_000) : 0;
  const rundown = useMemo(() => buildRundown({
    metrics, warnings: unrest?.warnings ?? [], reports: news?.items ?? [], emergencyPlanes: emergency, now: now ?? new Date(0),
    featured: brand ? null : FEATURED_STORY,
  }), [metrics, unrest, news, emergency, tenMin, brand]);
  const ukHour = useMemo(() => buildUkHour(rundown), [rundown]);
  useEffect(() => { if (import.meta.env.DEV) (window as unknown as { __ukHour?: unknown }).__ukHour = ukHour.map((x) => ({ id: x.seg.id, title: x.seg.title, start: x.start, end: x.end })); }, [ukHour]);

  // Clock-driven position: even London hours = UK hour, odd hours = other countries five minutes each.
  const rawPos = now ? positionAt(now) : { mode: "uk" as const, hourIndex: 0, msIntoHour: 0 };
  // Rented channels: only their chosen countries — UK-only stays on the UK hour, no-UK stays on world rotation.
  const pos = !hasUk ? { ...rawPos, mode: "world" as const } : WORLD.length === 0 ? { ...rawPos, mode: "uk" as const } : rawPos;
  const world = pos.mode === "world" ? worldCountryAt(WORLD.map((w) => w.key), pos) : null;
  const wc = world ? WORLD[world.index]! : null;
  const { data: countryData } = useQuery({ ...countryQuery(wc?.code ?? "fr"), enabled: !!wc });
  useQuery({ ...countryQuery(world ? WORLD[world.next]!.code : "fr"), enabled: !!world });

  let seg: Segment | undefined; let msIn = 0; let upNext: string[] = [];
  if (wc && world) {
    seg = countrySegment(wc.key, countryData, unrest?.warnings ?? [], now ?? new Date(0), news?.items ?? []);
    msIn = world.msIntoSlot;
    // Distinct upcoming countries only; with one country, say when it repeats rather than listing it three times.
    upNext = [...new Set([1, 2, 3].map((i) => WORLD[(world.index + i) % WORLD.length]!.code))]
      .filter((c) => c !== wc.code).map((c) => countryName(c));
    if (!upNext.length) upNext = [`${countryName(wc.code)} — fresh figures next round`];
    if (hasUk && 60 - Math.floor(pos.msIntoHour / 60_000) <= 15) upNext = [...upNext.slice(0, 2), "UK hour at the top of the hour"];
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
  const six = <TopSix boxes={topSix(worldData, iso3, boatsData, !wc)} name={wc ? countryName(wc.code) : "United Kingdom"} />;
  const header = <Header seg={seg} clock={clock} region={region} portrait={layout === "portrait"} />;
  const figure = !brand && promoAt(pos.msIntoHour).active ? <PromoCard /> : <FigureCard card={card} segId={seg?.id} big={!!seg?.headline} compact />;
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
  const promo = brand ? { active: false, msIntoPromo: 0 } : promoAt(pos.msIntoHour);
  const promoLines = scriptForPromo(sponsors.map((r) => r.name));
  const promoStep = Math.min(promoLines.length - 1, Math.floor(promo.msIntoPromo / (PROMO_MS / promoLines.length)));
  const reads = readingList(seg);
  // What the presenter is actually saying right now; the Orbit card and globe follow it so voice and screen match.
  const [spoken, setSpoken] = useState<{ text: string | null; country: string | null }>({ text: null, country: null });
  const live = useRef({ reads, country: seg?.country ?? null }); live.current = { reads, country: seg?.country ?? null };
  const onSpeak = useCallback((text: string) => setSpoken((o) => ({ text, country: live.current.reads.includes(text) ? live.current.country : o.country })), []);
  const anchor = brand?.presenter === "self"
    ? <SelfPresenter line={reads.length ? reads[step % reads.length]! : scriptForCard(card)} name={brand.presentedBy ?? brand.name} />
    : promo.active
    ? <Presenter line={promoLines[promoStep]!} upcoming={promoLines.slice(promoStep + 1, promoStep + 4)} voice={voice} />
    : <Presenter line={reads.length ? reads[step % reads.length]! : scriptForCard(card)} upcoming={reads.length ? [1, 2, 3].map((i) => reads[(step + i) % reads.length]!) : [reads[0] ?? ""].filter(Boolean)} voice={voice} />;
  const orbitLine = promo.active ? promoLines[promoStep]! : reads.length ? reads[step % reads.length]! : scriptForCard(card);
  const orbitUp = promo.active ? promoLines.slice(promoStep + 1, promoStep + 4) : reads.length ? [1, 2, 3].map((i) => reads[(step + i) % reads.length]!) : [];
  const orbitAnchor = brand?.presenter === "self" ? anchor : <OrbitPresenter line={orbitLine} upcoming={orbitUp} voice={voice} onSpeak={onSpeak} />;
  const orbitItem = itemForSpoken(seg, reads, spoken.text, step);
  const globeCountry = spoken.country ?? seg?.country ?? "united kingdom";
  const hourStart = now ? now.getTime() - pos.msIntoHour : 0;
  const orbitNext: { title: string; time: string | null }[] = !wc && ukHour.length && now
    ? [1, 2, 3].map((i) => ukHour[ukSlotAt(ukHour, pos.msIntoHour).index + i]).filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => ({ title: x.seg.title, time: london(new Date(hourStart + x.start), { hour: "2-digit", minute: "2-digit" }) }))
    : upNext.map((t) => ({ title: t, time: null }));
  if (orbitNext.length < 3 && !wc) orbitNext.push(...upNext.slice(orbitNext.length).map((t) => ({ title: t, time: null })));
  const orbitTicker = [
    ...(unrest?.warnings ?? []).filter((w) => w.mentionsUnrest).slice(0, 6).map((w) => ({ text: `${w.source} · ${w.country}: ${w.text}`, official: true })),
    ...(news?.items ?? []).slice(0, 10).map((r) => ({ text: `${r.publisher}: ${r.title}`, official: false })),
  ];
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
  <div data-frame data-layout={layout} data-variant={variant} className="absolute left-0 top-0 origin-top-left overflow-hidden bg-night font-sans text-night-fg"
    style={{ width: W, height: H, transform: `scale(${scale})`, left: offset.x, top: offset.y }}>
    {layout === "landscape" && variant === "orbit" ? <>
      {/* Globe Orbit: full-bleed globe flies to each country; scene panel changes per segment type */}
      {/* Globe Orbit v3 — laid out like the 32s reference video */}
      <div className="absolute left-[470px] top-[-150px] h-[1260px] w-[1510px]"><ClientOnly><Suspense fallback={null}><OrbitGlobe country={globeCountry} /></Suspense></ClientOnly></div>
      <OrbitBackdrop />
      <div className="orbit-scrim pointer-events-none absolute inset-0 z-[12]" />
      <div aria-hidden className="orbit-studio-mullion absolute bottom-[165px] left-[410px] top-0 z-[13] w-[38px]" />
      <div aria-hidden className="orbit-studio-rail absolute inset-x-0 bottom-[167px] z-[13] h-[26px]" />
      <div className="absolute left-[54px] top-[44px] z-40 flex h-[62px] overflow-hidden border border-night-fg/20 shadow-lg"><span className="flex items-center bg-destructive px-5 text-[36px] font-black text-destructive-foreground">UKSTATS</span><span className="orbit-glass relative flex items-center gap-3 px-5 text-[36px] font-black"><span className="size-2 rounded-full bg-destructive motion-safe:animate-pulse" />LIVE</span></div>
      <div className="absolute right-8 top-8 z-40 text-right font-mono text-[18px] uppercase leading-snug tracking-widest text-night-muted">{clock}<br />{wc ? "Around the world" : "UK hour"} · Official sources</div>
      <div className="orbit-tuck absolute left-[54px] top-[168px] z-[15] w-[400px]"><OrbitNextUp now={promo.active ? "About UKStats" : seg?.title ?? "Official UK statistics"} items={orbitNext} /></div>
      {slides.length > 0 && <div className="absolute bottom-[176px] left-[54px] z-[15] h-[300px] w-[400px] orbit-tilt-left orbit-tuck"><OrbitSponsor rows={slides} ms={pos.msIntoHour} /></div>}
      <div className="absolute bottom-[137px] left-[325px] z-20 h-[890px] w-[730px] origin-bottom motion-safe:animate-[orbit-head_9s_ease-in-out_infinite]">{orbitAnchor}</div>
      <div aria-hidden className="orbit-desk absolute inset-x-0 bottom-[80px] z-[21] h-[91px] border-t border-electric-soft/60"><div className="orbit-desk-reflection absolute inset-x-0 top-0 h-full" /><div className="orbit-desk-paper absolute bottom-[38px] left-[580px] h-[12px] w-[285px]" /></div>
      <div className="absolute right-[54px] top-[250px] z-30 flex w-[590px] flex-col gap-4">{!brand && promo.active ? <PromoCard /> : <><OrbitHeroCard seg={seg} scene={sceneFor(seg)} step={step} place={wc ? countryName(wc.code) : "UK"} item={orbitItem} />{wc ? <OrbitMiniTiles seg={seg} step={step} /> : <OrbitStatsRail items={keyFigures(metrics)} checked={checkedLabel(stats?.fetchedAt, t)} />}</>}</div>
      <div className="absolute bottom-[136px] left-[565px] z-40"><OrbitLowerThird tag={promo.active ? "About UKStats" : wc ? "World" : "UK"} /></div>
      <div className="absolute inset-x-0 bottom-0 z-40 h-[80px]"><OrbitTicker items={orbitTicker} clock={now ? london(now, { hour: "2-digit", minute: "2-digit" }) : ""} /></div>
    </> : layout === "landscape" ? (variant === "classic" ? <>
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
      <div className={`absolute left-6 z-30 ${slides.length ? "bottom-[356px] w-[440px]" : "bottom-[232px] w-[540px]"}`}>{clip}</div>
      <div className="absolute bottom-[240px] left-[656px] z-30 w-[560px]">{lower}</div>
      <div className={`absolute bottom-[120px] right-0 z-40 h-[104px] ${slides.length ? "left-[640px]" : "left-0"}`}>{tickers}</div>
      {slides.length > 0 && <div className="absolute bottom-[120px] left-0 z-40 h-[220px] w-[640px]"><StreamSponsors rows={slides} ms={pos.msIntoHour} /></div>}
    </> : <>
      {/* Rented layouts: "split" = half globe / half figures; "data-wall" = figures dominate, smaller globe */}
      <div className="absolute inset-y-0 left-0" style={{ width: V.globe }}><GlobeExplorer state={s} onChange={onChange} broadcast /></div>
      <div className="absolute inset-x-0 top-[96px] z-40 h-[96px]">{header}</div>
      <div className="absolute left-6 top-[212px] z-30" style={{ width: V.globe - 460 }}>{next}</div>
      <div className="absolute top-[212px] z-30" style={{ left: V.globe - 196 }}>{qr}</div>
      <aside data-fit className="absolute right-0 top-[192px] z-30 flex h-[664px] flex-col gap-4 overflow-hidden border-l-2 border-night-line bg-night-panel p-5" style={{ width: 1920 - V.globe }}>
        {six}
        {fresh}
        {boatsChip}
        <div className="min-h-0 flex-1">{figure}</div>
      </aside>
      <div className="absolute left-6 z-30" style={{ top: 420, width: Math.min(420, V.globe - 48), height: 410 }}>{anchor}</div>
      <div className="absolute bottom-[240px] z-30" style={slides.length ? { left: 656, width: Math.max(360, V.globe - 680) } : { left: Math.min(460, V.globe - 400), width: Math.max(360, V.globe - 484) }}>{lower}</div>
      <div className={`absolute bottom-[120px] right-0 z-40 h-[104px] ${slides.length ? "left-[640px]" : "left-0"}`}>{tickers}</div>
      {slides.length > 0 && <div className="absolute bottom-[120px] left-0 z-40 h-[220px] w-[640px]"><StreamSponsors rows={slides} ms={pos.msIntoHour} /></div>}
    </>) : <>
      <div className="absolute inset-x-0 top-[120px] z-40 h-[140px]">{header}</div>
      <div className="absolute inset-x-0 top-[260px] h-[500px]"><GlobeExplorer state={s} onChange={onChange} broadcast /></div>
      <div className="absolute left-6 top-[280px] z-30 w-[520px]">{next}</div>
      <div className="absolute right-6 top-[280px] z-30 h-[310px] w-[300px]">{anchor}</div>
      <div className="absolute inset-x-6 top-[600px] z-30">{lower}</div>
      <aside data-fit className="absolute inset-x-0 top-[770px] z-30 flex h-[640px] flex-col gap-2 overflow-hidden border-y-2 border-night-line bg-night-panel px-6 py-4">{six}{fresh}<div className="min-h-0 flex-1 overflow-hidden">{figure}</div></aside>
      <div className="absolute right-6 top-[1420px] z-30">{qr}</div>
      {slides.length > 0 ? <div className="absolute left-6 top-[1420px] z-30 h-[220px] w-[640px]"><StreamSponsors rows={slides} ms={pos.msIntoHour} /></div>
        : <div className="absolute left-6 top-[1416px] z-30 w-[360px]">{clip}</div>}
      <div className="absolute inset-x-0 bottom-[120px] z-40 h-[104px]">{tickers}</div>
    </>}
    {brand && <BrandBadge brand={brand} portrait={layout === "portrait"} />}
    {watermark && <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center"><span className="rotate-[-12deg] rounded-xl border-4 border-destructive px-10 py-4 font-mono text-[72px] font-black uppercase tracking-widest text-destructive opacity-70">{watermark}</span></div>}
  </div></div>;
}

const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();

/** Customer branding: their logo/name plus a fixed data credit. Sits in its own corner, never over figures. */
function BrandBadge({ brand, portrait }: { brand: StreamBrand; portrait: boolean }) {
  return <div className={`absolute z-50 flex items-center gap-3 rounded-r-lg bg-night/90 py-2 pl-6 pr-5 ${portrait ? "left-0 top-[24px]" : "left-0 top-[16px]"}`} style={{ borderLeft: `10px solid ${brand.accent}` }}>
    {brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-[56px] w-auto max-w-[180px] object-contain" />}
    <div className="leading-tight">
      <div className="max-w-[560px] truncate text-[30px] font-black">{brand.name}</div>
      <div className="font-mono text-[16px] text-night-muted">{brand.presentedBy ? `Presented by ${brand.presentedBy} · ` : ""}Data: UKStats · official sources</div>
    </div>
  </div>;
}

/** Self-presenter mode: a clear webcam window for the customer's OBS camera, with an autocue of the on-screen figure. */
function SelfPresenter({ line, name }: { line: string; name: string }) {
  return <div className="flex h-full flex-col overflow-hidden rounded-lg border-2 border-dashed border-night-line">
    <div className="flex flex-1 items-center justify-center bg-night/30 font-mono text-[18px] text-night-muted">Your camera here</div>
    <div className="bg-night-panel p-3">
      <div className="font-mono text-[14px] font-bold uppercase tracking-widest text-electric">Autocue · {name}</div>
      <p className="line-clamp-4 text-[20px] leading-snug">{line}</p>
    </div>
  </div>;
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
    {!compact && card.metric?.yearAgo && <p className="text-[22px] font-semibold leading-snug text-night-muted">Change on a year earlier: {card.metric.yearAgo.dir === "flat" ? "unchanged" : `${card.metric.yearAgo.dir === "up" ? "▲" : "▼"} ${card.metric.yearAgo.diff}`} (from {card.metric.yearAgo.value}, {card.metric.yearAgo.period})</p>}
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
      <div className="inline-block whitespace-nowrap pl-[100%] motion-reduce:pl-4 text-[30px] font-bold motion-safe:animate-[stream-ticker_linear_infinite]" style={{ animationDuration: `${Math.max(40, text.length / 5) * (speed / 100)}s` }}>{text}</div>
    </div>
  </div>;
}

/** "About UKStats" break card — site explainer, domain and QR; contains no figures. */
function PromoCard() {
  return <section data-fit className="flex h-full items-center gap-6 overflow-hidden rounded border-2 border-electric bg-night p-5 motion-safe:animate-in motion-safe:fade-in">
    <div className="min-w-0 flex-1">
      <div className="font-mono text-[20px] font-black uppercase tracking-widest text-electric">About UKStats</div>
      <div className="mt-1 text-[52px] font-black leading-none tracking-tight">ukstats.co.uk</div>
      <p className="mt-3 text-[22px] leading-snug">The UK's independent register of official statistics. Every figure shows its source, date and next release. Free for everyone, forever.</p>
      <div className="mt-3 font-mono text-[18px] font-bold uppercase tracking-widest">Scan to open the site</div>
    </div>
    <div className="shrink-0 rounded bg-background p-2"><QRCodeSVG value="https://ukstats.co.uk/?utm_source=youtube&utm_medium=stream_promo" size={200} level="M" aria-label="QR code to ukstats.co.uk" /></div>
  </section>;
}

/** 1200x900 stream pictures made from each sponsor's own banner, keyed by website domain (Orbit box only). */
const STREAM_PICTURES: Record<string, string> = { "gopharma.ai": sp_gopharma.url, "rareitup.com": sp_rareitup.url, "gold.live": sp_goldlive.url, "xpre.ai": sp_xpre.url, "yachtfino.com": sp_yachtfino.url };

type CornerSlide = { id: string; name: string; img: string | null; streamImg?: string | null; label: string; qr: string; tag: string };

function sponsorSlide(r: SponsorBannerRow): CornerSlide {
  const site = sponsorSite(r.url);
  return { id: r.id, name: r.name, streamImg: STREAM_PICTURES[site.label.replace(/^www\./, "")] ?? null, img: r.banner_link ?? (r.banner_path ? null : r.banner_url), label: site.label, qr: site.qr, tag: "Supported by" };
}

const utm = (u: string) => { const x = new URL(u); x.searchParams.set("utm_source", "youtube"); x.searchParams.set("utm_medium", "ukstats_stream"); return x.toString(); };
/** Independent works (not sponsors) shown only on the UKStats stream; links only, no figures. */
const RECOMMENDED_SLIDES: CornerSlide[] = [
  { id: "rec-inquiry", name: "The Rape Gang Inquiry", img: null, label: "therapeganginquiry.org", qr: utm("https://www.therapeganginquiry.org/"), tag: "Recommended" },
  { id: "rec-book", name: "The Grooming Gang Cover-Up", img: bookStream.url, label: "amazon.co.uk", qr: utm("https://www.amazon.co.uk/dp/0995584982"), tag: "Recommended" },
];

/** Corner box: approved sponsors plus labelled recommendations, ~10s each, kept apart from figures. */
/** 4:3 pictures (1200x900 recommended) fill the box; any other shape is shown whole, right-aligned over navy, never cropped. */
function SponsorPicture({ src }: { src: string }) {
  const [fits, setFits] = useState(true);
  return <span className="orbit-sponsor-fallback absolute inset-0 block">
    <img src={src} alt="" onLoad={(e) => { const i = e.currentTarget; setFits(Math.abs(i.naturalWidth / i.naturalHeight - 4 / 3) < 0.08); }}
      className={`absolute inset-0 h-full w-full ${fits ? "object-cover" : "object-contain object-right"}`} />
  </span>;
}

/** Orbit sponsor card (left column, like the reference): one at a time, big QR. */
function OrbitSponsor({ rows, ms }: { rows: CornerSlide[]; ms: number }) {
  const r = rows[Math.floor(ms / 10_000) % rows.length]!;
  const pct = ((ms % 10_000) / 10_000) * 100;
  return <section data-fit key={r.id} className="orbit-sponsor-card orbit-glass relative flex h-full flex-col overflow-hidden rounded-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 motion-safe:duration-500">
    <span aria-hidden className="orbit-accent absolute inset-x-0 top-0 h-[3px]" />
    <div className="flex min-h-0 flex-1">
      <div className="relative z-10 flex w-[48%] flex-col p-4 pb-3">
        <span className="font-mono text-[12px] font-black uppercase tracking-widest text-sponsor-tag [text-shadow:0_1px_3px_rgb(0_0_0_/0.65)]">{r.tag}</span>
        <p className="mt-1 line-clamp-4 text-[23px] font-black uppercase leading-[1.08] drop-shadow">{r.name}</p>
      </div>
      <div aria-hidden className="orbit-sponsor-img absolute inset-0 overflow-hidden">
        {(r.streamImg ?? r.img) ? <SponsorPicture src={(r.streamImg ?? r.img)!} /> : <span className="orbit-sponsor-fallback block h-full w-full" />}
      </div>
    </div>
    <div className="relative z-10 mx-4 flex items-center gap-4 border-t border-night-fg/20 py-3">
      <div className="shrink-0 rounded bg-stream-strap p-1"><QRCodeSVG value={r.qr} size={92} level="H" marginSize={1} bgColor="#ffffff" fgColor="#000000" aria-label={`QR code to ${r.label}`} /></div>
      <div className="min-w-0"><p className="text-[17px] font-black uppercase leading-tight">Scan to<br />discover more</p><p className="mt-1 break-all font-mono text-[13px] text-electric-soft">{r.label}</p></div>
    </div>
    <div className="absolute bottom-0 left-0 h-[4px] bg-destructive" style={{ width: `${pct}%` }} />
  </section>;
}

function StreamSponsors({ rows, ms }: { rows: CornerSlide[]; ms: number }) {
  const r = rows[Math.floor(ms / 10_000) % rows.length]!;
  const pct = ((ms % 10_000) / 10_000) * 100;
  return <section data-fit key={r.id} className="relative flex h-full overflow-hidden border-2 border-night-line bg-night-panel text-night-fg motion-safe:animate-in motion-safe:fade-in">
    <div className="flex min-w-0 flex-1 flex-col">
      <div className={`relative aspect-[3/1] w-full shrink-0 overflow-hidden ${r.id === "rec-inquiry" ? "bg-destructive text-destructive-foreground" : "bg-night"}`}>
        {r.img ? <img src={r.img} alt={r.name} className="h-full w-full object-contain" />
          : <span className="flex h-full items-center justify-center px-3 pt-4 text-center text-[30px] font-black leading-tight">{r.name}</span>}
        <span className="absolute left-0 top-0 bg-sponsor-tag px-2 py-0.5 font-mono text-[12px] font-black uppercase tracking-widest text-primary">{r.tag}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 leading-tight">
        <span className="truncate text-[22px] font-black">{r.name}</span>
        <span className="truncate font-mono text-[17px] font-bold">{r.label}</span>
      </div>
    </div>
    <div className="flex w-[196px] shrink-0 flex-col items-center justify-center gap-1 bg-[#ffffff] p-2 text-[#000000]">
      <QRCodeSVG value={r.qr} size={164} level="H" marginSize={2} bgColor="#ffffff" fgColor="#000000" aria-label={`QR code to ${r.label}`} />
      <span className="font-mono text-[13px] font-black uppercase">Scan to visit</span>
    </div>
    <div className="absolute bottom-0 left-0 h-[4px] bg-destructive" style={{ width: `${pct}%` }} />
  </section>;
}

/** QR target: the sponsor's own http(s) site, else the public sponsors page. */
function sponsorSite(url: string | null | undefined): { qr: string; label: string } {
  try {
    const u = new URL(url ?? "");
    if (u.protocol !== "https:" && u.protocol !== "http:") throw 0;
    u.searchParams.set("utm_source", "youtube"); u.searchParams.set("utm_medium", "ukstats_stream");
    return { qr: u.toString(), label: u.hostname };
  } catch { return { qr: SPONSOR_QR_URL, label: "ukstats.co.uk/sponsors" }; }
}

const SPONSOR_QR_URL = "https://ukstats.co.uk/sponsors?utm_source=youtube&utm_medium=stream_sponsor";


