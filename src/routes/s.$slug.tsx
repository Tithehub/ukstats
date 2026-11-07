import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { channelQuery } from "./s.$slug_.broadcast";

/** Public watch page for a rented channel: a scaled preview of the branded stream. */
export const Route = createFileRoute("/s/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(channelQuery(params.slug)),
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.display_name} — live official statistics` : "Stream — UKStats";
    const d = "Official statistics with sources, dates and next releases, presented in this channel's own branding and powered by UKStats.";
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: Watch,
});

function Watch() {
  const { slug } = Route.useParams();
  const { data: ch } = useSuspenseQuery(channelQuery(slug));
  return <main className="mx-auto max-w-6xl px-4 py-8">
    <h1 className="text-3xl font-semibold">{ch?.display_name ?? "Channel not found"} <span className="text-xl font-normal text-muted-foreground">live official statistics</span></h1>
    {ch?.presented_by && <p className="mt-1 text-muted-foreground">Presented by {ch.presented_by}</p>}
    {ch?.live ? <div className="relative mt-6 aspect-video overflow-hidden rounded-lg border">
      <iframe title={`${ch.display_name} stream`} src={`/s/${slug}/broadcast?voice=off`} className="absolute inset-0 h-full w-full border-0" />
    </div> : <p className="mt-6 rounded-lg border p-6">This stream is not active right now.</p>}
    <p className="mt-4 text-sm text-muted-foreground">Figures: UKStats register of official sources — each shows its source, period, data age and next release. The channel controls branding only.</p>
    <Link to="/rent" className="mt-4 inline-block text-sm underline">Run your own branded stream</Link>
  </main>;
}
