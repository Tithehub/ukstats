import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { channelQuery } from "@/lib/rent-channel-query";
import { ShareRow } from "@/components/ShareRow";

/** Public watch page for a rented channel: branded header, the stream and share buttons. */
export const Route = createFileRoute("/s/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(channelQuery(params.slug)),
  head: ({ loaderData, params }) => {
    const t = loaderData ? `${loaderData.display_name} — live official statistics` : "Stream — UKStats";
    const d = "Official statistics with sources, dates and next releases, presented in this channel's own branding and powered by UKStats.";
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "website" }, { property: "og:url", content: `https://ukstats.co.uk/s/${params.slug}` },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `https://ukstats.co.uk/s/${params.slug}` }],
    };
  },
  component: Watch,
});

function Watch() {
  const { slug } = Route.useParams();
  const { data: ch } = useSuspenseQuery(channelQuery(slug));
  return <div className="min-h-screen bg-night text-night-fg">
    <header className="border-b-4 bg-night-panel" style={{ borderColor: ch?.accent ?? undefined }}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
        {ch?.logo_url && <img src={ch.logo_url} alt="" className="h-12 w-auto max-w-[160px] object-contain" />}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black sm:text-3xl">{ch?.display_name ?? "Channel not found"} <span className="text-base font-normal text-night-muted">live official statistics</span></h1>
          {ch?.presented_by && <p className="text-sm text-night-muted">Presented by {ch.presented_by}</p>}
        </div>
        {ch?.live && <span className="ml-auto shrink-0 rounded bg-destructive px-2 py-1 font-mono text-xs font-bold text-destructive-foreground">● LIVE</span>}
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-6">
      {ch?.live ? <div className={`relative overflow-hidden rounded-xl border border-night-line ${ch.layout === "portrait" ? "mx-auto aspect-[9/16] max-h-[80vh]" : "aspect-video"}`}>
        <iframe title={`${ch.display_name} stream`} src={`/s/${slug}/broadcast?voice=off`} className="absolute inset-0 h-full w-full border-0" allow="autoplay" />
      </div> : <p className="rounded-xl border border-night-line p-6">This stream is not active right now.</p>}
      {ch && <div className="mt-4"><ShareRow path={`/s/${slug}`} title={`${ch.display_name} — live official statistics`} /></div>}
      <p className="mt-4 text-sm text-night-muted">Figures come from the UKStats register of official publishers — each shows its source, period, data age and next release. This channel controls its branding only.</p>
      <Link to="/rent" className="mt-4 inline-flex rounded-lg border border-night-line px-4 py-2 text-sm font-semibold">Powered by UKStats — run your own branded stream</Link>
    </main>
  </div>;
}
