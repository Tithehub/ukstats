import { createFileRoute, Link } from "@tanstack/react-router";
import { getSharedPage } from "@/lib/shared-pages.functions";
import { getUkStats } from "@/lib/uk-stats.functions";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type Freshness, type Metric } from "@/lib/uk-stats";
import { countdown } from "@/lib/tiers";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const { page, expired } = await getSharedPage({ data: { slug: params.slug } });
    if (!page || expired) return { page, expired: true as const, metrics: [] as Metric[], fetchedAt: "" };
    const stats = await getUkStats();
    const metrics = page.metricIds
      .map((id) => stats.metrics.find((m) => m.id === id))
      .filter((m): m is Metric => Boolean(m));
    return { page, expired: false as const, metrics, fetchedAt: stats.fetchedAt };
  },
  head: ({ params, loaderData }) => ({
    meta: [
      { title: loaderData?.page ? `${loaderData.page.title} — live UK statistics` : "Live page unavailable" },
      {
        name: "description",
        content: loaderData?.page
          ? `${loaderData.page.title}: live official UK statistics with source, reference period, data age and next release date on every figure.`
          : "This live UK statistics page is no longer available.",
      },
      { property: "og:title", content: loaderData?.page?.title ?? "Live UK statistics page" },
      {
        property: "og:description",
        content: "Live official UK statistics — sourced, timestamped, and downloadable as a PDF.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://ukstats.co.uk/p/${params.slug}` },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.expired ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [{ rel: "canonical", href: `https://ukstats.co.uk/p/${params.slug}` }],
  }),
  component: LivePage,
});

const freshText: Record<Freshness, string> = {
  fresh: "text-fresh",
  ageing: "text-ageing",
  overdue: "text-overdue",
  unknown: "text-steel/60",
};
const freshBg: Record<Freshness, string> = {
  fresh: "bg-fresh",
  ageing: "bg-ageing",
  overdue: "bg-overdue",
  unknown: "bg-steel/40",
};

function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const links: { name: string; href: string }[] = [
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
  ];

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel transition-colors hover:bg-ink/10"
        >
          {l.name}
        </a>
      ))}
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
        className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel transition-colors hover:bg-ink/10"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] text-ground transition-colors hover:bg-steel"
      >
        Download PDF
      </button>
    </div>
  );
}

function Row({ metric }: { metric: Metric }) {
  const tone = freshnessOf(metric);
  return (
    <article className="break-inside-avoid rounded-[12px] bg-card/60 p-4 ring-1 ring-ink/10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/60">{metric.category}</p>
          <h2 className="mt-0.5 text-[15px] font-semibold leading-snug tracking-tight text-balance">{metric.title}</h2>
        </div>
        <span className="shrink-0 rounded-md bg-ink/5 px-2 py-1 font-mono text-[10px] text-steel">
          {metric.source.split(" · ")[0]}
        </span>
      </div>
      <p className="mt-3 font-mono text-[1.9rem] font-semibold leading-none tracking-tighter tabular-nums">
        {metric.value ?? (metric.status === "no-feed" ? "No live feed" : "Unavailable")}
      </p>
      <p className="mt-1 font-mono text-[11px] text-steel/70">{metric.period ?? metric.sub}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 border-t border-ink/10 pt-2 font-mono text-[10px]">
        <span className={`inline-flex items-center gap-1.5 ${freshText[tone]}`}>
          <span className={`size-1.5 rounded-full ${freshBg[tone]}`} />
          as of {fmtDate(metric.asOf)} · {ageLabel(metric.asOf)}
        </span>
        <span className="text-steel/60">{dueLabel(metric.nextDue)}</span>
      </div>
      <a
        href={metric.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block font-mono text-[10px] text-steel/50 underline decoration-brand underline-offset-2"
      >
        {metric.source}
      </a>
    </article>
  );
}

function LivePage() {
  const { page, expired, metrics, fetchedAt } = Route.useLoaderData();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);

  if (!page) {
    return (
      <div className="grid min-h-screen place-items-center bg-ground px-4 font-sans text-ink">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">This live page doesn't exist</h1>
          <p className="mt-2 text-sm text-steel">The link may have been mistyped or the page was never created.</p>
          <Link to="/create" className="mt-5 inline-block rounded-md bg-ink px-4 py-2 text-sm text-ground">
            Create your own
          </Link>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="grid min-h-screen place-items-center bg-ground px-4 font-sans text-ink">
        <div className="max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-overdue">Expired</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-balance">“{page.title}” is no longer live</h1>
          <p className="mt-2 text-sm text-steel">
            This page ran until {fmtDate(page.expiresAt)}. Extend it from your live pages, or build a new one.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/my-pages" className="rounded-md bg-ink px-4 py-2 text-sm text-ground">
              Extend it
            </Link>
            <Link to="/create" className="rounded-md px-4 py-2 text-sm text-steel ring-1 ring-ink/10">
              Create a new page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground font-sans text-ink print:bg-white">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <header className="border-b border-steel/15 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel/60">
                UK National Data Register · live sheet
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{page.title}</h1>
              <p className="mt-2 font-mono text-[11px] text-steel">
                Data pulled {new Date(fetchedAt).toLocaleString("en-GB")} · {metrics.length} official figures ·{" "}
                {countdown(page.expiresAt)}
              </p>
            </div>
            <ShareBar url={url} title={page.title} />
          </div>
        </header>

        <main className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
          {metrics.map((m) => (
            <Row key={m.id} metric={m} />
          ))}
        </main>

        <footer className="mt-8 border-t border-steel/15 pt-4 font-mono text-[11px] text-steel/70">
          <p className="text-pretty">
            Every figure is reproduced exactly as published by the issuing body — ONS, Home Office, HM Land Registry,
            Police.uk, World Bank/SIPRI and Open-Meteo. Nothing is estimated, modelled or interpolated. Each card states
            its source, reference period, data age and next scheduled release.
          </p>
          <p className="no-print mt-3">
            <Link to="/" className="underline decoration-brand underline-offset-2">
              Open the full register
            </Link>{" "}
            ·{" "}
            <Link to="/create" className="underline decoration-brand underline-offset-2">
              Make your own live page
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
