import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, House, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { MetricCard } from "@/components/MetricCard";
import { getRegionDashboard } from "@/lib/regions.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/regions/$slug")({
  loader: async ({ params }) => {
    const dash = await getRegionDashboard({ data: { slug: params.slug } });
    if (!dash) throw notFound();
    return dash;
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.region.name ?? "Region";
    const desc =
      loaderData?.region.blurb ??
      "Official statistics for this UK region, each with its source and publication date.";
    return {
      meta: [
        { title: `${name} statistics — crime, house prices, NHS | UKStats` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} statistics — UKStats` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://ukstats.co.uk/regions/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://ukstats.co.uk/regions/${params.slug}` }],
    };
  },
  component: RegionPage,
  notFoundComponent: () => (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">Region not found</h1>
        <p className="mt-2 text-night-muted">
          There is no dashboard at this address. <Link to="/regions" className="text-electric-soft underline">See all regions</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  ),
});

function RegionPage() {
  const dash = Route.useLoaderData();
  const { region } = dash;

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
        <Link
          to="/regions"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-night-muted hover:text-electric-soft"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All regions
        </Link>
        <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">
          Regional dashboard · {region.code}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{region.name}</h1>
        <p className="mt-3 max-w-2xl text-night-muted">{region.blurb}</p>

        {/* House prices */}
        <section className="mt-10" aria-labelledby="region-housing">
          <h2 id="region-housing" className="flex items-center gap-2 text-lg font-semibold">
            <House className="h-4.5 w-4.5 text-electric" aria-hidden /> House prices
          </h2>
          {dash.housePrice ? (
            <div className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-5">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">Average house price</p>
              <p className="mt-1 text-3xl font-semibold">{dash.housePrice.formatted}</p>
              <p className="mt-2 font-mono text-[12px] text-night-muted">
                {dash.housePrice.period ? `${dash.housePrice.period} · ` : ""}
                <a
                  href={dash.housePrice.sourceUrl}
                  className="text-electric-soft underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  {dash.housePrice.source}
                </a>
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-5 font-mono text-[13px] text-overdue">
              No live feed. The UK HPI region series could not be read for this request — reload to try again.
            </p>
          )}
        </section>

        {/* Crime */}
        <section className="mt-10" aria-labelledby="region-crime">
          <h2 id="region-crime" className="flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="h-4.5 w-4.5 text-electric" aria-hidden /> Recorded crime
          </h2>
          {region.crimeSource === "psni" ? (
            <p className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-5 text-[13px] text-night-muted">
              Recorded crime in Northern Ireland is published by the{" "}
              <a
                href="https://www.psni.police.uk/about-us/our-publications-and-reports/official-statistics/police-recorded-crime-statistics"
                className="text-electric-soft underline"
                rel="noreferrer"
                target="_blank"
              >
                PSNI <ExternalLink className="inline h-3 w-3" aria-hidden />
              </a>{" "}
              in its own series; no machine-readable feed is available to this site, so no figure is shown rather
              than an estimate.
            </p>
          ) : dash.crimeLayers.length ? (
            <div className="mt-4 space-y-8">
              {dash.crimeLayers.map((layer) => (
                <div key={layer.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-semibold">{layer.title}</h3>
                    <p className="font-mono text-[12px] text-night-muted">
                      {layer.unit}
                      {layer.period ? ` · ${layer.period}` : ""}
                      {layer.asOf ? ` · published ${fmtDate(layer.asOf)}` : ""}
                    </p>
                  </div>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-night-line/70">
                    <table className="w-full border-collapse font-mono text-[12px]">
                      <thead className="bg-night-panel text-night-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-normal">Area</th>
                          <th className="px-3 py-2 text-right font-normal">{layer.unit}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...layer.areas]
                          .sort((a, b) => b.value - a.value)
                          .map((a) => (
                            <tr key={a.code} className="border-t border-night-line/50">
                              <td className="px-3 py-2 text-night-fg">{a.name}</td>
                              <td className="px-3 py-2 text-right text-night-fg">{a.formatted}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 font-mono text-[12px] text-night-muted">
                    Source:{" "}
                    <a href={layer.sourceUrl} className="text-electric-soft underline" rel="noreferrer" target="_blank">
                      {layer.source}
                    </a>{" "}
                    · {layer.coverage}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-5 font-mono text-[13px] text-overdue">
              No live feed. The publisher's data file could not be read for this request — reload to try again.
            </p>
          )}
        </section>

        {/* NHS (Scotland) */}
        {dash.nhs.length ? (
          <section className="mt-10" aria-labelledby="region-nhs">
            <h2 id="region-nhs" className="text-lg font-semibold">NHS performance</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dash.nhs.map((m) => (
                <MetricCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        ) : null}

        {dash.gaps.length ? (
          <section className="mt-10" aria-labelledby="region-gaps">
            <h2 id="region-gaps" className="text-lg font-semibold">Not published for this area</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] text-night-muted">
              {dash.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <ShareRow title={`${region.name} statistics — UKStats`} path={`/regions/${region.slug}`} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
