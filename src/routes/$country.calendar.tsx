import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
export const Route = createFileRoute('/$country/calendar')({
 loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
 head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Release calendar', 'Release calendar for official country statistics, with publisher links and transparent availability.'),
 component: Page,
 errorComponent: () => <main className="p-8">Country data unavailable. Please try again.</main>,
 notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function Page() { const { country } = Route.useParams(); const { data } = useSuspenseQuery(countryQuery(country)); if (!data) return null; return <CountryShell country={data.country}><h2 className="mt-6 text-2xl font-semibold">Release calendar</h2><p className="mt-2 text-sm text-night-muted">Dates are shown only when confirmed by the publisher. A publication cadence is not a scheduled release date.</p><div className="mt-6 divide-y divide-night-line">{data.metrics.map(m => <div key={m.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_1fr]"><Link to="/$country/explained/$metricId" params={{ country, metricId: m.id }} className="text-sm text-electric-soft">{m.title}</Link><div className="text-sm"><p>{m.next ?? 'Exact date not confirmed'}</p><p className="mt-1 text-xs text-night-muted">{m.cadence}</p><a className="text-xs text-electric-soft underline" href={m.calendarUrl ?? m.sourceUrl} target="_blank" rel="noreferrer">Publisher calendar / release page</a></div></div>)}</div></CountryShell>; }
