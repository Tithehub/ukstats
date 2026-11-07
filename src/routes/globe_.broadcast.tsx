import { createFileRoute } from "@tanstack/react-router";
import { BroadcastView, statsQuery, type Layout } from "@/components/stream/BroadcastView";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";

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

function BroadcastPage() {
  return <BroadcastView layout={Route.useSearch().layout ?? "landscape"} />;
}
