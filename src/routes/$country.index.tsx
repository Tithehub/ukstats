import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CountryCard } from '@/components/CountryCard';
import { CountryShell } from '@/components/CountryShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { countryQuery } from '@/lib/country-queries';
import { COUNTRY_CATEGORIES, countryHead, downloadText, metricCategory } from '@/lib/country-detail';
import { countryByCode } from '@/lib/countries';
import { categoryIcon } from '@/lib/ui';
import { Download } from 'lucide-react';
export const Route = createFileRoute('/$country/')({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s['q'] === 'string' ? s['q'] : undefined } as { q?: string }),
  loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
  head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Official statistics register', 'Official economy, migration, crime, housing, health and defence figures with source links, reference periods, publication age and release information.'),
  component: CountryPage,
  errorComponent: () => <main className="p-8">Country figures could not be loaded. Please try again.</main>,
  notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function CountryPage() {
  const { country } = Route.useParams(); const { q = "" } = Route.useSearch(); const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(countryQuery(country)); if (!data) return null;
  const published = data.metrics.filter(m => m.value !== null).length;
  const shown = data.metrics.filter(m => `${m.title} ${m.source} ${metricCategory(m)}`.toLowerCase().includes(q.toLowerCase()));
  return <CountryShell country={data.country}>
    <div className="my-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-mono text-sm text-fresh">{published} sourced figures · {data.metrics.length - published} gaps or unavailable feeds</p><p className="mt-2 text-sm text-night-muted">{data.country.office}{data.country.eurostat ? ' · Eurostat' : ''}</p></div>
      <Button variant="outline" size="sm" onClick={() => downloadText(JSON.stringify(data, null, 2), `${country}-statistics.json`, 'application/json')}><Download />JSON</Button>
    </div>
    <Input aria-label="Search country statistics" placeholder="Search figures or publishers" value={q} onChange={e => navigate({ search: { q: e.target.value }, replace: true })} className="max-w-lg" />
    {COUNTRY_CATEGORIES.map(category => { const rows = shown.filter(m => metricCategory(m) === category); const Icon = categoryIcon(category); return rows.length ? <section key={category} className="mt-9"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Icon className="size-5 text-electric-soft" />{category === 'NHS & doctors' ? 'Healthcare & doctors' : category}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map(m => <CountryCard key={m.id} m={m} country={country} />)}</div></section> : null; })}
    {!shown.length && <p className="my-8 text-night-muted">No matching figures.</p>}
    <p className="mt-8 font-mono text-xs text-night-muted">Feeds checked {new Date(data.fetchedAt).toUTCString()}</p>
  </CountryShell>;
}
