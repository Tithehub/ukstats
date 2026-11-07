import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BroadcastView, statsQuery } from "@/components/stream/BroadcastView";
import { brandFromChannel } from "@/components/stream/stream-brand";
import { channelQuery } from "@/lib/rent-channel-query";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";

/** A customer's rented, branded stream frame for OBS. Figures are the UKStats register, unchanged. */
export const Route = createFileRoute("/s/$slug_/broadcast")({
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(channelQuery(params.slug)),
    context.queryClient.ensureQueryData(worldQuery()),
    context.queryClient.ensureQueryData(unrestQuery()),
    context.queryClient.ensureQueryData(statsQuery).catch(() => null),
  ]),
  head: () => ({ meta: [
    { title: "Branded stream — powered by UKStats" },
    { name: "description", content: "A branded live statistics stream using official UKStats figures with sources and dates." },
    { property: "og:title", content: "Branded stream — powered by UKStats" },
    { property: "og:description", content: "Official figures, dated and sourced, in a streamer's own branding." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: RentedBroadcast,
});

function RentedBroadcast() {
  const { slug } = Route.useParams();
  const { data: ch } = useSuspenseQuery(channelQuery(slug));
  if (!ch || !ch.live) return <div className="fixed inset-0 flex items-center justify-center bg-night p-8 text-center text-night-fg">
    <div><p className="text-3xl font-semibold">This stream is not active</p><p className="mt-2 text-night-muted">Powered by UKStats · ukstats.co.uk/rent</p></div>
  </div>;
  return <BroadcastView layout={ch.layout === "portrait" ? "portrait" : "landscape"} brand={brandFromChannel(ch)} />;
}
