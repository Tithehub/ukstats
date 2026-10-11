import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getRegionList } from "@/lib/regions.functions";

export const Route = createFileRoute("/regions/")({
  head: () => ({
    meta: [
      { title: "Regional dashboards — official statistics by UK nation and region" },
      {
        name: "description",
        content:
          "Official statistics for every UK nation and English region: recorded crime, average house prices and NHS performance, each with its source and publication date.",
      },
      { property: "og:title", content: "Regional dashboards — UKStats" },
      {
        property: "og:description",
        content: "Recorded crime, house prices and NHS figures for every UK nation and English region.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/regions" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/regions" }],
  }),
  loader: () => getRegionList(),
  component: RegionsPage,
});

function RegionsPage() {
  const regions = Route.useLoaderData();
  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Geography</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Regional dashboards</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Every nation of the UK and every English region, built only from figures its official publishers release.
          Where a body publishes nothing machine-readable for an area, the page says so rather than estimating.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <Link
              key={r.slug}
              to="/regions/$slug"
              params={{ slug: r.slug }}
              className="group rounded-lg border border-night-line/70 bg-night-panel p-5 transition-colors hover:border-electric/60"
            >
              <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">
                <MapPin className="h-3.5 w-3.5 text-electric" aria-hidden /> {r.code}
              </p>
              <h2 className="mt-2 text-xl font-semibold group-hover:text-electric-soft">{r.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-night-muted">{r.blurb}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <ShareRow title="UK regional statistics dashboards" path="/regions" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
