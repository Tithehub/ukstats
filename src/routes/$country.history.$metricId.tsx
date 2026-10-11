import { createFileRoute, notFound } from '@tanstack/react-router';
import { countryHistoryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
import { CountryMetricDetail } from '@/components/CountryMetricDetail';
export const Route = createFileRoute('/$country/history/$metricId')({
  loader: async ({ params, context }) => { const data = await context.queryClient.ensureQueryData(countryHistoryQuery(params.country, params.metricId)); if (!data) throw notFound(); return data; },
  head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, `${params.metricId} — history`, 'Official statistics, definitions, published observations and source information; nothing estimated.'),
  component: Detail,
  errorComponent: () => <main className="p-8">This figure could not be loaded. Please try again.</main>,
  notFoundComponent: () => <main className="p-8">Figure not found.</main>,
});
function Detail() { const { country, metricId } = Route.useParams(); const data = Route.useLoaderData(); const c = countryByCode(country); const m = data; if (!c || !m) return null; return <CountryShell country={c}><CountryMetricDetail country={c} metric={m} history={true} /></CountryShell>; }
