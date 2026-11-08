import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { fmtDate } from "@/lib/uk-stats";
import { SCANDALS_CHECKED } from "@/lib/scandals.data";
import { SCANDAL_IMAGES } from "@/lib/scandals.images";
import { findScandal, orderedVideos, sortedHeadlines, ytThumb, ytUrl } from "@/lib/scandals";

export const Route = createFileRoute("/scandals/$slug")({
  loader: ({ params }) => {
    const s = findScandal(params.slug);
    if (!s) throw notFound();
    return { slug: s.slug, title: s.title, summary: s.summary };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Scandal not found | UK Stats" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} — official records and headlines | UK Stats`;
    const url = `https://ukstats.co.uk/scandals/${params.slug}`;
    return {
      meta: [{ title: t }, { name: "description", content: loaderData.summary.slice(0, 158) }, { property: "og:title", content: t }, { property: "og:description", content: loaderData.summary.slice(0, 200) }, { property: "og:type", content: "article" }, { property: "og:url", content: url }, { name: "twitter:card", content: "summary_large_image" }, ...(SCANDAL_IMAGES[params.slug] ? [{ property: "og:image", content: `https://ukstats.co.uk${SCANDAL_IMAGES[params.slug].src}` }, { name: "twitter:image", content: `https://ukstats.co.uk${SCANDAL_IMAGES[params.slug].src}` }] : [])],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => <div className="p-10">Scandal not found. <Link to="/scandals" className="underline">All scandals</Link></div>,
  component: Page,
});

function H({ children }: { children: string }) {
  return <h2 className="mt-10 border-b border-night-line pb-2 text-2xl font-semibold tracking-tight">{children}</h2>;
}

function Page() {
  const { slug } = Route.useParams();
  const s = findScandal(slug)!;
  const img = SCANDAL_IMAGES[slug];
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/scandals" className="font-mono text-xs underline">← All scandals</Link>
        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-night-muted">{s.region}</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">{s.title}</h1>
        {img && (
          <figure className="mt-5">
            <img src={img.src} alt={img.alt} className="aspect-[21/9] w-full rounded-md border border-night-line object-cover" />
            <figcaption className="mt-1 text-xs text-night-muted">{img.alt}. Photo: <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{img.credit}, {img.licence}, via Wikimedia Commons</a>. Illustrative only.</figcaption>
          </figure>
        )}
        <div className="mt-4 inline-block rounded-md border border-night-line bg-night-panel px-3 py-2 text-sm"><span className="font-mono text-xs text-night-muted">Status · </span><span className="font-semibold">{s.status}</span></div>

        <H>What happened</H>
        <p className="mt-3 max-w-3xl">{s.summary}</p>
        <p className="mt-2 text-xs text-night-muted">Written from the official records below. Links checked {fmtDate(SCANDALS_CHECKED)}.</p>
        {s.related && <Link to={s.related.to} className="mt-3 inline-block font-semibold text-electric-soft underline">{s.related.label} →</Link>}

        <H>Official record</H>
        <ul className="mt-3 grid gap-2">
          {s.official.map((o) => (
            <li key={o.url} className="rounded-md border border-night-line bg-night-panel p-3">
              <a href={o.url} target="_blank" rel="noreferrer" className="font-semibold underline">{o.title}</a>
              <div className="mt-1 font-mono text-xs text-night-muted">{o.publisher}{o.published ? ` · published ${fmtDate(o.published)}` : ""}</div>
            </li>
          ))}
        </ul>

        <H>Main headlines</H>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-night-muted">News — not an official source. Titles shown word for word.</p>
        {s.headlines.length === 0 ? <p className="mt-2 text-sm text-night-muted">No headlines added yet.</p> : (
          <ul className="mt-3 grid gap-2">
            {sortedHeadlines(s.headlines).map((h) => (
              <li key={h.url} className="rounded-md border border-night-line p-3">
                <a href={h.url} target="_blank" rel="noreferrer" className="underline">{h.title}</a>
                <div className="mt-1 font-mono text-xs text-night-muted">{h.outlet} · {fmtDate(h.published)}</div>
              </li>
            ))}
          </ul>
        )}

        <H>Videos on YouTube</H>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-night-muted">Opens on YouTube. Broadcaster videos are news, not an official source.</p>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {orderedVideos(s.videos).map((v) => (
            <li key={v.id}>
              <a href={ytUrl(v.id)} target="_blank" rel="noreferrer" className="block rounded-md border border-night-line bg-night-panel p-2 hover:border-electric-soft">
                <img src={ytThumb(v.id)} alt="" loading="lazy" className="aspect-video w-full rounded object-cover" />
                <div className="mt-2 text-sm font-semibold">{v.title}</div>
                <div className="mt-1 font-mono text-xs text-night-muted">{v.channel} · {v.official ? "Official channel" : "News — not an official source"}</div>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
