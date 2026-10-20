import { createFileRoute, Link } from "@tanstack/react-router";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { worldQuery } from "@/lib/world.functions";
import { MAX_LAG_YEARS, WORLD_CATEGORIES, WORLD_INDICATORS, WORLD_SOURCE, fmtWorld, indicatorBySlug, rankIndicator } from "@/lib/world";

const T = "World rankings for every country | UKStats";
const D = "Country leaderboards for 20 official figures — economy, people, jobs, health, safety and energy — across over 200 countries, ranked from the World Bank's published data, with the year of each figure.";

export const Route = createFileRoute("/world/")({
  validateSearch: (s: Record<string, unknown>) => ({ figure: typeof s['figure'] === "string" ? s['figure'] : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(worldQuery()),
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/world" }],
  }),
  component: WorldPage,
  errorComponent: () => <main className="p-8">World figures are unavailable right now. Please try again.</main>,
});

function WorldPage() {
  const { data } = useSuspenseQuery(worldQuery());
  const { figure } = Route.useSearch();
  const navigate = Route.useNavigate();
  const ind = indicatorBySlug(figure);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ? rankIndicator(data, ind) : []), [data, ind]);
  const shown = rows.filter((r) => r.country.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">World rankings</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/world-compare" search={{ countries: "GBR,FRA,USA" }}>Compare two or three countries</Link></Button>
        <p className="mt-2 max-w-2xl text-night-muted">{D}</p>
        <RestoreSignupCta />
        <p className="mt-2 text-sm">
          Source: <a href={WORLD_SOURCE.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">{WORLD_SOURCE.name}</a>
          {data?.updated[ind.id] && <> · last updated by the World Bank {data.updated[ind.id]}</>}
        </p>

        <div className="mt-6 space-y-3">
          {WORLD_CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-night-muted">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {WORLD_INDICATORS.filter((i) => i.category === cat).map((i) => (
                  <Button key={i.slug} size="sm" variant={i.slug === ind.slug ? "default" : "outline"} onClick={() => navigate({ search: { figure: i.slug }, replace: true })}>
                    {i.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <h2 className="mt-8 text-2xl font-semibold">{ind.label}: country leaderboard</h2>

        {!data ? (
          <div className="mt-8 rounded-md border border-night-line bg-night-panel p-6">
            <p className="font-medium">No live feed right now</p>
            <p className="mt-1 text-sm text-night-muted">The World Bank didn't answer. The figures are always available at <a href={WORLD_SOURCE.url} className="text-electric-soft underline">data.worldbank.org</a>.</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-night-muted">{ind.note} Countries whose latest figure is more than {MAX_LAG_YEARS} years older than the newest are listed at the end without a rank.</p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a country"
              aria-label="Find a country"
              className="mt-4 w-full max-w-sm rounded-md border border-night-line bg-night-panel px-3 py-2 text-sm"
            />
            <div className="mt-4 overflow-x-auto rounded-md border border-night-line">
              <table className="w-full text-sm">
                <thead className="bg-night-panel text-left font-mono text-[11px] uppercase tracking-wider text-night-muted">
                  <tr><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Country</th><th className="px-3 py-2 text-right">{ind.label}</th><th className="px-3 py-2 text-right">Year</th></tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.country.iso3} className="border-t border-night-line">
                      <td className="px-3 py-2 font-mono text-night-muted">{r.rank ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Link to="/world/$iso" params={{ iso: r.country.iso3.toLowerCase() }} className="hover:text-electric-soft hover:underline">{r.country.name}</Link>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{fmtWorld(r.value, ind.unit)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${r.rank ? "text-night-muted" : "text-ageing"}`}>{r.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-night-muted">{rows.filter((r) => r.rank).length} countries ranked · {data.countries.length} economies listed by the World Bank</p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
