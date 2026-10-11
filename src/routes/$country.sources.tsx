import { createFileRoute, Link } from '@tanstack/react-router';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
export const Route = createFileRoute('/$country/sources')({
 loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
 head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Official sources', 'Official sources for official country statistics, with publisher links and transparent availability.'),
 component: Page,
 errorComponent: () => <main className="p-8">Country data unavailable. Please try again.</main>,
 notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function Page() { const { country } = Route.useParams(); const data = Route.useLoaderData(); if (!data) return null; return <CountryShell country={data.country}><h2 className="mt-6 text-2xl font-semibold">Official sources</h2><div className="mt-6 divide-y divide-night-line">{data.metrics.map(m => <div key={m.id} className="py-4"><h3 className="text-sm font-medium">{m.title}</h3><a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm text-electric-soft underline">{m.source}</a><p className="mt-1 text-xs text-night-muted">{m.cadence} · {m.period ?? 'No period available'}</p></div>)}</div></CountryShell>; }
