import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getComparison } from "@/lib/countries.functions";
import { ES_DEFS } from "@/lib/eurostat";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const cmpQuery = (metric: string) => queryOptions({ queryKey: ["compare", metric], queryFn: () => getComparison({ data: { metric } }), staleTime: 10 * 60_000 });
const T = "Compare European countries — inflation, debt, unemployment | UK Stats";
const D = "Side-by-side official Eurostat figures for 30 European countries, harmonised so they are genuinely comparable.";

export const Route = createFileRoute("/compare-countries")({
  validateSearch: (s: Record<string, unknown>) => ({ metric: typeof s["metric"] === "string" ? s["metric"] : "hicp" }),
  loaderDeps: ({ search }) => ({ metric: search.metric }),
  loader: ({ deps, context }) => context.queryClient.ensureQueryData(cmpQuery(deps.metric)),
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Compare,
});

function Compare() {
  const { metric } = Route.useSearch();
  const { data } = useSuspenseQuery(cmpQuery(metric));
  const rows = [...data.rows].sort((a, b) => (b.raw ?? -Infinity) - (a.raw ?? -Infinity));
  const max = Math.max(...rows.map((r) => Math.abs(r.raw ?? 0)), 1);
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Compare countries</h1>
        <p className="mt-2 text-night-muted">{D} The UK left Eurostat's series in 2020, so its own figures stay on the UK register.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {ES_DEFS.map((d) => (
            <Link key={d.id} to="/compare-countries" search={{ metric: d.id }} className={`rounded-md border px-3 py-1.5 text-sm ${d.id === metric ? "border-electric text-electric-soft" : "border-night-line text-night-muted"}`}>{d.title}</Link>
          ))}
        </div>
        <h2 className="mt-8 text-lg font-semibold">{data.title}</h2>
        <table className="mt-3 w-full font-mono text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-night-line">
                <td className="py-1.5 pr-3"><Link to="/$country" params={{ country: r.code }} className="hover:text-electric-soft">{r.name}</Link></td>
                <td className="w-1/2"><div className="h-2 rounded-sm bg-electric" style={{ width: `${(Math.abs(r.raw ?? 0) / max) * 100}%` }} /></td>
                <td className="py-1.5 pl-3 text-right">{r.value ?? "Not published"}</td>
                <td className="pl-3 text-right text-night-muted">{r.period ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs text-electric-soft underline">Source: {data.source}</a>
      </main>
      <SiteFooter />
    </div>
  );
}
