import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { worldQuery } from "@/lib/world.functions";
import { WORLD_INDICATORS, WORLD_SOURCE, fmtWorld, rankIndicator } from "@/lib/world";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/world/$iso")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(worldQuery());
    const c = data?.countries.find((x) => x.iso3.toLowerCase() === params.iso.toLowerCase());
    if (data && !c) throw notFound();
    return { name: c?.name ?? params.iso.toUpperCase() };
  },
  head: ({ loaderData, params }) => {
    const n = loaderData?.name ?? "Country";
    const t = `${n} in numbers — official figures | UKStats`;
    const d = `${n}'s 20 economy, population, jobs, health and energy indicators from the World Bank, with world ranks, reporting years and official sources.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: `https://ukstats.co.uk/world/${params.iso.toLowerCase()}` }],
    };
  },
  component: CountryProfile,
  notFoundComponent: () => <main className="p-8">We couldn't find that country. <Link to="/world" search={{ figure: undefined }} className="underline">See all countries</Link></main>,
  errorComponent: () => <main className="p-8">World figures are unavailable right now. Please try again.</main>,
});

function CountryProfile() {
  const { data } = useSuspenseQuery(worldQuery());
  const { iso } = Route.useParams();
  const c = data?.countries.find((x) => x.iso3.toLowerCase() === iso.toLowerCase());
  const full = c ? countryByCode(c.iso2) : undefined;

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/world" search={{ figure: undefined }} className="text-sm text-electric-soft hover:underline">← World rankings</Link>
        {!data || !c ? (
          <p className="mt-6">No live feed right now — see <a href={WORLD_SOURCE.url} className="text-electric-soft underline">data.worldbank.org</a>.</p>
        ) : (
          <>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{c.name}</h1>
            <p className="mt-1 text-night-muted">{c.region}{c.income && ` · ${c.income}`}{c.capital && ` · Capital: ${c.capital}`}</p>
            <Link to="/world-compare" search={{ countries: `${c.iso3},${c.iso3 === "GBR" ? "USA" : "GBR"}` }} className="mt-3 inline-block text-sm text-electric-soft underline">Compare with another country →</Link>
            {(full || c.iso2 === "GB") && (
              <p className="mt-3 text-sm">
                Full live page:{" "}
                {c.iso2 === "GB" ? <Link to="/register" className="text-electric-soft underline">UK statistics</Link> : full ? <Link to="/$country" params={{ country: full.code }} className="text-electric-soft underline">{c.name}</Link> : null}
              </p>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WORLD_INDICATORS.map((ind) => {
                const v = data.values[ind.id]?.[c.iso3];
                const rows = rankIndicator(data, ind);
                const row = rows.find((r) => r.country.iso3 === c.iso3);
                const ranked = rows.filter((r) => r.rank).length;
                return (
                  <div key={ind.id} className="rounded-md border border-night-line bg-night-panel p-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">{ind.label}</p>
                    {v ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold">{fmtWorld(v.value, ind.unit)}</p>
                        <p className="mt-1 text-xs text-night-muted">
                          {v.year} · {row?.rank ? <Link to="/world" search={{ figure: ind.slug }} className="hover:underline">#{row.rank} of {ranked}</Link> : "not ranked (older figure)"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-night-muted">Not published</p>
                    )}
                    <a href={`https://data.worldbank.org/indicator/${ind.id}?locations=${c.iso2}`} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-electric-soft hover:underline">Source: World Bank</a>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
