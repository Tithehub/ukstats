import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
export const Route = createFileRoute('/$country/status')({
 loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
 head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Feed health', 'Feed health for official country statistics, with publisher links and transparent availability.'),
 component: Page,
 errorComponent: () => <main className="p-8">Country data unavailable. Please try again.</main>,
 notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function Page() { const { country } = Route.useParams(); const { data } = useSuspenseQuery(countryQuery(country)); if (!data) return null; return <CountryShell country={data.country}><h2 className="mt-6 text-2xl font-semibold">Feed health</h2><p className="mt-2 font-mono text-xs text-night-muted">Checked {new Date(data.fetchedAt).toUTCString()}</p><div className="mt-6 divide-y divide-night-line">{data.metrics.map(m => <div key={m.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_1fr]"><Link className="text-sm text-electric-soft" to="/$country/explained/$metricId" params={{ country, metricId: m.id }}>{m.title}</Link><div><p className={`font-mono text-xs ${m.value !== null ? 'text-fresh' : 'text-ageing'}`}>{m.value !== null ? 'Sourced figure' : m.status === 'unavailable' ? 'Feed unavailable' : 'No live feed integrated / no published observation'}</p><p className="mt-1 text-xs text-night-muted">{m.note ?? `Latest period: ${m.period ?? 'unknown'}`}</p></div></div>)}</div></CountryShell>; }
