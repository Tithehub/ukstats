import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { GlobeExplorer, type GlobeState } from "@/components/globe/GlobeExplorer";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";

/** TV-style page captured by an external streamer (OBS / ffmpeg) for YouTube Live. Shows only what /globe shows. */
export const Route = createFileRoute("/globe_/broadcast")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(worldQuery()), context.queryClient.ensureQueryData(unrestQuery())]),
  head: () => ({ meta: [
    { title: "UKStats live globe broadcast" },
    { name: "description", content: "Full-screen broadcast view of the UKStats globe: official warnings, flights, small boats and news reports, each dated and sourced." },
    { property: "og:title", content: "UKStats live globe broadcast" },
    { property: "og:description", content: "Full-screen broadcast view of the UKStats globe with official sources and dates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: BroadcastPage,
});

const RELOAD_MS = 4 * 60 * 60_000;

function BroadcastPage() {
  const [s, setS] = useState<GlobeState>({ ind: "none", official: true, acled: false, c: "united kingdom", fl: true, mg: true, nw: true } as GlobeState);
  const onChange = useCallback((p: Partial<GlobeState>) => setS((o) => ({ ...o, ...p })), []);
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 15_000);
    // Watchdog: reload every few hours, and soon after any uncaught error, so the stream never freezes.
    const r = setTimeout(() => location.reload(), RELOAD_MS);
    const onErr = () => setTimeout(() => location.reload(), 60_000);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => { clearInterval(t); clearTimeout(r); window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); };
  }, []);
  return <div className="relative flex h-dvh flex-col overflow-hidden bg-night text-night-fg">
    <main className="relative flex flex-1 flex-col"><GlobeExplorer state={s} onChange={onChange} /></main>
    <div className="pointer-events-none absolute bottom-3 left-3 z-50 rounded border border-electric/40 bg-night/85 px-3 py-1.5 font-mono text-sm">
      <span className="mr-2 inline-block size-2 rounded-full bg-destructive align-middle" />LIVE · {now} London · Data from official sources — ukstats.co.uk
    </div>
  </div>;
}
