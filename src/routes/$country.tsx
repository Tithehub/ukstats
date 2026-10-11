import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCountryStats } from "@/lib/countries.functions";
import { countryByCode } from "@/lib/countries";
import { CountryCard } from "@/components/CountryCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const countryQuery = (code: string) =>
  queryOptions({ queryKey: ["country", code], queryFn: () => getCountryStats({ data: { code } }), staleTime: 10 * 60_000 });

export const Route = createFileRoute("/$country")({
  beforeLoad: ({ params }) => {
    if (!countryByCode(params.country)) throw notFound();
  },
  loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
  head: ({ params }) => {
    const c = countryByCode(params.country);
    const t = c ? `${c.name} official statistics — inflation, debt, jobs, asylum | UK Stats` : "Not found";
    const d = c ? `Live official figures for ${c.name} from Eurostat and ${c.office}: source, period, data age and cadence on every number.` : "";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: CountryPage,
});

function CountryPage() {
  const { country } = Route.useParams();
  const { data } = useSuspenseQuery(countryQuery(country));
  if (!data) return null;
  const c = data.country;
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/countries" className="text-sm text-electric-soft">← All countries</Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{c.name}</h1>
        <p className="mt-2 max-w-2xl text-night-muted">
          Official figures{c.eurostat ? " from Eurostat and national publishers" : " from national publishers"}, including{" "}
          <a href={c.officeUrl} target="_blank" rel="noreferrer" className="underline">{c.office}</a>. Nothing is estimated or filled in — a blank card means nothing is published.
        </p>
        {data.metrics.length === 0 ? (
          <div className="mt-8 rounded-lg border border-night-line bg-night-panel p-6">
            <p className="font-mono">No live feed yet</p>
            <p className="mt-2 text-sm text-night-muted">{c.name} is in our next wave, using its own national publishers. Until then see <a className="underline" href={c.officeUrl} target="_blank" rel="noreferrer">{c.office}</a>.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.metrics.map((m) => <CountryCard key={m.id} m={m} />)}
          </div>
        )}
        <p className="mt-6 font-mono text-xs text-night-muted">Checked {new Date(data.fetchedAt).toUTCString()}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
