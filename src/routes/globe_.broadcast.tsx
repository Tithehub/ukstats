import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GlobeExplorer, type GlobeState } from "@/components/globe/GlobeExplorer";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { getUkStats } from "@/lib/uk-stats.functions";
import { newsReportsQuery } from "@/lib/news-reports.functions";
import { flightsQuery } from "@/lib/flights.functions";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type StatsPayload } from "@/lib/uk-stats";
import { clipCaption, clipsFor } from "@/lib/stream-clips";
import { STREAM_CLIPS } from "@/lib/stream-clips.data";
import { buildRundown, CARD_MS, SEGMENT_MS, statsTicker } from "@/lib/stream-rundown";

const statsQuery = { queryKey: ["uk-stats"], queryFn: () => getUkStats() as Promise<StatsPayload>, staleTime: 5 * 60_000, refetchInterval: 15 * 60_000 };

/** TV news-channel page captured by an external streamer (ffmpeg / OBS) for YouTube Live. */
export const Route = createFileRoute("/globe_/broadcast")({
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
  const [s, setS] = useState<GlobeState>({ ind: "none", official: true, acled: false, c: "united kingdom", fl: true, mg: true, nw: true } as GlobeState);
  const onChange = useCallback((p: Partial<GlobeState>) => setS((o) => ({ ...o, ...p })), []);
  const { data: stats } = useQuery(statsQuery);
  const { data: unrest } = useQuery(unrestQuery());
  const { data: news } = useQuery(newsReportsQuery(true));
  const { data: flights } = useQuery(flightsQuery(true));
  const [now, setNow] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fit = () => { const k = Math.min(innerWidth / 1920, innerHeight / 1080); setScale(k); setOffset({ x: (innerWidth - 1920 * k) / 2, y: (innerHeight - 1080 * k) / 2 }); };
    fit(); addEventListener("resize", fit);
    // Report any text running past its box to the studio preview.
    const chk = setInterval(() => {
      const bad = [...document.querySelectorAll<HTMLElement>("[data-fit]")].some((el) => el.scrollHeight > el.clientHeight + 1);
      if (parent !== window) parent.postMessage({ type: "ukstats-stream-fit", ok: !bad }, location.origin);
    }, 3000);
    return () => { removeEventListener("resize", fit); clearInterval(chk); };
  }, []);

  useEffect(() => {
    setNow(new Date());
    const c = setInterval(() => setNow(new Date()), 10_000);
    const t = setInterval(() => setTick((x) => x + 1), CARD_MS);
    // Watchdog: reload every few hours, and soon after any uncaught error, so the stream never freezes.
    const r = setTimeout(() => location.reload(), RELOAD_MS);
    const onErr = () => setTimeout(() => location.reload(), 60_000);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => { clearInterval(c); clearInterval(t); clearTimeout(r); window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); };
  }, []);

  const metrics = stats?.metrics ?? [];
  const emergency = flights?.planes ? flights.planes.filter((p) => p[7] === "7500" || p[7] === "7600" || p[7] === "7700").length : null;
  const rundown = useMemo(() => buildRundown({
    metrics, warnings: unrest?.warnings ?? [], reports: news?.items ?? [], emergencyPlanes: emergency, now: now ?? new Date(0),
  }), [metrics, unrest, news, emergency, now && Math.floor(now.getTime() / 600_000)]);

  const perSeg = Math.round(SEGMENT_MS / CARD_MS);
  const segIdx = rundown.length ? Math.floor(tick / perSeg) % rundown.length : 0;
  const seg = rundown[segIdx];
  const step = tick % perSeg;
  const card = seg?.cards.length ? seg.cards[step % seg.cards.length] : null;
  const head = seg?.headlines.length ? seg.headlines[step % seg.headlines.length] : null;
  const upNext = rundown.length > 1 ? [1, 2, 3].map((i) => rundown[(segIdx + i) % rundown.length]!).filter((x, i, a) => a.indexOf(x) === i && x !== seg) : [];

  useEffect(() => { if (seg) setS((o) => ({ ...o, c: seg.country, ...seg.layers, fl: seg.layers.fl || o.fl })); }, [seg?.id]);

  const latest = [
    ...(unrest?.warnings ?? []).filter((w) => w.mentionsUnrest).slice(0, 8).map((w) => `${w.source} · ${w.country}: ${w.text}`),
    ...(news?.items ?? []).slice(0, 8).map((r) => `${r.publisher}: ${r.title}`),
  ];
  const keyStats = statsTicker(metrics);

  return <div className="fixed inset-0 overflow-hidden bg-night">
  <div data-frame className="absolute left-0 top-0 grid h-[1080px] w-[1920px] origin-top-left grid-rows-[96px_64px_minmax(0,1fr)_72px_120px] overflow-hidden bg-night font-sans text-night-fg" style={{ transform: `scale(${scale})`, left: offset.x, top: offset.y }}>
    {/* Globe sits behind everything; YouTube's title and control zones show only the globe */}
    <div className="absolute inset-y-0 left-0 w-[1420px]"><GlobeExplorer state={s} onChange={onChange} broadcast /></div>
    <div aria-hidden className="row-start-1" />
    {/* Channel header — sits below YouTube's title bar zone */}
    <header className="relative z-40 row-start-2 flex items-stretch overflow-hidden border-y border-night-line bg-night-panel">
      <div className="flex items-center gap-2 bg-primary px-5 py-2 text-primary-foreground">
        <span className="text-2xl font-black tracking-tight">UKSTATS</span><span className="rounded bg-destructive px-1.5 text-sm font-bold text-destructive-foreground">LIVE</span>
      </div>
      <div key={seg?.id} className="flex flex-1 items-center px-5 text-xl font-bold uppercase tracking-wide motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4">{seg?.title ?? "Official UK statistics"}</div>
      <div className="flex items-center gap-3 px-5 font-mono text-lg">
        <span className="inline-block size-2.5 animate-pulse rounded-full bg-destructive" />
        {now ? london(now, { weekday: "short", day: "numeric", month: "short" }) : ""} <b>{now ? london(now, { hour: "2-digit", minute: "2-digit" }) : ""}</b> London
      </div>
    </header>

    <div className="relative row-start-3 flex min-h-0">
      <div className="relative min-w-0 flex-1" />

      <aside data-fit className="z-30 flex w-[500px] min-h-0 flex-col gap-3 overflow-hidden border-l border-night-line bg-night-panel/95 p-4">
        {card ? <section key={`${seg?.id}-${card.title}`} className="rounded border border-night-line bg-night p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4">
          <div className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-electric">
            {card.metric && <span className={`inline-block size-2 rounded-full ${FRESH[freshnessOf(card.metric)]}`} />}{card.kicker}
          </div>
          <h2 className="line-clamp-2 text-lg font-semibold leading-tight">{card.title}</h2>
          <div className="my-2 truncate text-5xl font-black tabular-nums">{card.value}</div>
          {card.sub && <p className="line-clamp-2 text-sm text-night-muted">{card.sub}</p>}
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs text-night-muted">
            <dt>Source</dt><dd className="truncate text-night-fg">{card.source}</dd>
            {card.period && <><dt>Period</dt><dd>{card.period}</dd></>}
            {card.asOf && <><dt>Published</dt><dd>{card.metric ? `${fmtDate(card.asOf)} · ${ageLabel(card.asOf)}` : hhmm(card.asOf)}</dd></>}
            {card.metric && <><dt>Next</dt><dd>{card.nextDue ? `${fmtDate(card.nextDue)} · ${dueLabel(card.nextDue)}` : "Not announced"}</dd></>}
          </dl>
        </section> : <section className="rounded border border-night-line bg-night p-4 text-sm text-night-muted">Every figure on UKStats comes from the official publisher, with its date and next release.</section>}

        <ClipBox segmentId={seg?.id ?? ""} />

        {upNext.length > 0 && <section className="mt-auto rounded border border-night-line p-3">
          <h3 className="mb-1 font-mono text-xs uppercase tracking-widest text-electric">Up next</h3>
          <ol className="space-y-1 text-sm">{upNext.map((u) => <li key={u.id} className="truncate">▸ {u.title}</li>)}</ol>
        </section>}
        <div className="shrink-0 font-mono text-xs text-night-muted">Source: ukstats.co.uk · official publishers only</div>
      </aside>

      {/* Lower third */}
      {head && <div key={head.text} className="absolute bottom-4 left-4 z-30 max-w-[860px] overflow-hidden rounded border border-night-line bg-night-panel/95 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
        <div className={`px-3 py-0.5 font-mono text-xs font-bold uppercase ${head.official ? "bg-destructive text-destructive-foreground" : "bg-electric text-night"}`}>{head.official ? "Official warning" : "News report — not official"}</div>
        <p className="line-clamp-2 px-3 pt-1.5 text-xl font-semibold leading-snug">{head.text}</p>
        <p className="px-3 pb-1.5 font-mono text-xs text-night-muted">{head.publisher}{head.time ? ` · ${hhmm(head.time)} London` : ""}</p>
      </div>}
    </div>

    {/* Tickers — sit above YouTube's player-button zone */}
    <footer className="relative z-40 row-start-4 overflow-hidden border-t border-night-line">
      <Ticker label="LATEST" items={latest} cls="bg-destructive text-destructive-foreground" speed={90} />
      <Ticker label="UK STATS" items={keyStats} cls="bg-primary text-primary-foreground" speed={140} />
    </footer>
  </div></div>;
}

function ClipBox({ segmentId }: { segmentId: string }) {
  const clips = useMemo(() => clipsFor(segmentId, STREAM_CLIPS), [segmentId]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [segmentId]);
  const c = clips.length ? clips[i % clips.length]! : null;
  return <section className="overflow-hidden rounded border border-night-line bg-night">
    <div className="relative h-[200px] bg-night-panel">
      {c ? <video key={c.id} src={c.url} autoPlay muted playsInline onEnded={() => setI((x) => x + 1)} className="absolute inset-0 size-full object-cover" />
        : <div className="absolute inset-0 grid place-items-center p-4 text-center font-mono text-xs text-night-muted">No licensed clip for this topic</div>}
      {c && <span className="absolute left-2 top-2 rounded bg-night/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest">Footage</span>}
    </div>
    {c && <p className="px-2 py-1.5 font-mono text-[11px] leading-snug text-night-muted"><span className="text-night-fg">{c.description}</span><br />{clipCaption(c)}</p>}
  </section>;
}

function Ticker({ label, items, cls, speed }: { label: string; items: string[]; cls: string; speed: number }) {
  if (!items.length) return null;
  const text = items.join("   •   ");
  return <div className="flex h-9 items-center overflow-hidden bg-night-panel">
    <span className={`z-10 h-full shrink-0 px-3 py-1.5 font-mono text-sm font-bold ${cls}`}>{label}</span>
    <div className="relative flex-1 overflow-hidden">
      <div className="inline-block whitespace-nowrap pl-[100%] text-base motion-safe:animate-[stream-ticker_linear_infinite]" style={{ animationDuration: `${Math.max(40, text.length / 6) * (speed / 100)}s` }}>{text}</div>
    </div>
  </div>;
}
