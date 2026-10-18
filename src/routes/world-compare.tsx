import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { PageLoading, PageLoadError } from "@/components/layout/PageFeedback";
import { worldQuery } from "@/lib/world.functions";
import { WORLD_SOURCE, fmtWorld } from "@/lib/world";
import { comparisonCountries, comparisonRows } from "@/lib/world-comparison";
import { fmtDate } from "@/lib/uk-stats";

const title = "Compare two or three countries — official world figures | UKStats";
const description = "Compare 20 World Bank indicators side by side, with each country's reporting year, source, missing figures and comparability warnings.";
export const Route = createFileRoute("/world-compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    countries: typeof search["countries"] === "string" ? search["countries"].split(",").slice(0, 3).join(",") : "GBR,FRA,USA",
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(worldQuery()),
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }], links: [{ rel: "canonical", href: "https://ukstats.co.uk/world-compare" }] }),
  component: WorldComparison,
});

function WorldComparison() {
  const { data } = useSuspenseQuery(worldQuery());
  const { countries } = Route.useSearch();
  const navigate = Route.useNavigate();
  const selected = data ? comparisonCountries(data, countries.split(",")) : [];
  const options = [...(data?.countries ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const change = (index: number, code: string) => {
    const next = selected.map(country => country.iso3);
    if (code) next[index] = code;
    else next.splice(index, 1);
    void navigate({ search: { countries: [...new Set(next)].join(",") } });
  };
  return <div className="min-h-dvh bg-night text-night-fg"><SiteHeader /><main className="mx-auto max-w-6xl px-4 py-10">
    <Link to="/world" search={{ figure: undefined }} className="text-sm text-electric-soft underline">← World rankings</Link>
    <h1 className="mt-3 text-3xl font-semibold">Compare countries</h1>
    <p className="mt-2 text-night-muted">Published values, not an overall country score. Different reporting years and missing figures are marked separately.</p>
    {data ? <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(index => <label key={index} className="text-sm">Country {index + 1}<select aria-label={`Country ${index + 1}`} value={selected[index]?.iso3 ?? ""} onChange={event => change(index, event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-night-line bg-night-panel px-3"><option value="">{index === 2 ? "No third country" : "Select country"}</option>{options.filter(country => !selected.some((other, i) => i !== index && other.iso3 === country.iso3)).map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</select></label>)}</div>
      {selected.length < 2 ? <p role="status" className="mt-8 text-night-muted">Select at least two countries.</p> : <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><caption className="sr-only">Official country figures with reporting years and comparison limitations</caption><thead className="border-y border-night-line text-left"><tr><th className="py-3 pr-4">Indicator</th>{selected.map(country => <th key={country.iso3} className="px-3 py-3">{country.name}</th>)}<th className="px-3 py-3">Comparison</th></tr></thead><tbody>{comparisonRows(data, selected.map(country => country.iso3)).map(({ indicator, status }) => <tr key={indicator.id} className="border-b border-night-line"><th scope="row" className="max-w-64 py-4 pr-4 text-left font-medium"><Link to="/world" search={{ figure: indicator.slug }} className="text-electric-soft underline">{indicator.label}</Link><span className="mt-1 block text-xs font-normal text-night-muted">{indicator.note}</span></th>{selected.map(country => { const value = data.values[indicator.id]?.[country.iso3]; return <td key={country.iso3} className="px-3 py-4 align-top">{value ? <><p className="font-mono">{fmtWorld(value.value, indicator.unit)}</p><p className="mt-1 text-xs text-night-muted">{value.year}</p></> : <p className="text-night-muted">Not published in this feed</p>}<a href={`https://data.worldbank.org/indicator/${indicator.id}?locations=${country.iso2}`} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-electric-soft underline">Official source</a></td>; })}<td className={`max-w-44 px-3 py-4 align-top text-xs ${status === "Same indicator and reporting year" ? "text-night-muted" : "text-ageing"}`}>{status}</td></tr>)}</tbody></table></div>}
      <p className="mt-5 text-xs text-night-muted">Source: <a href={WORLD_SOURCE.url} className="text-electric-soft underline">{WORLD_SOURCE.name}</a> · Snapshot checked {fmtDate(data.fetchedAt)}. National methods may still differ; the linked indicator notes are authoritative. Next release: no single date announced for these indicators.</p>
      <div className="mt-5 flex flex-wrap gap-2">{selected.map(country => <Button key={country.iso3} asChild variant="outline"><Link to="/world/$iso" params={{ iso: country.iso3.toLowerCase() }}>{country.name} profile</Link></Button>)}</div>
    </> : <p role="status" className="mt-8">No live feed right now — <a href={WORLD_SOURCE.url} className="text-electric-soft underline">World Bank source</a>.</p>}
  </main><SiteFooter /></div>;
}