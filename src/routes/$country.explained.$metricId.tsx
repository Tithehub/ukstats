import { createFileRoute, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
import { CountryMetricDetail } from '@/components/CountryMetricDetail';
export const Route = createFileRoute('/$country/explained/$metricId')({
  loader: async ({ params, context }) => { const data = await context.queryClient.ensureQueryData(countryQuery(params.country)); if (!data?.metrics.some(m => m.id === params.metricId)) throw notFound(); return data; },
  head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, `${params.metricId} — explained`, 'Official statistics, definitions, published observations and source information; nothing estimated.'),
  component: Detail,
  errorComponent: () => <main className="p-8">This figure could not be loaded. Please try again.</main>,
  notFoundComponent: () => <main className="p-8">Figure not found.</main>,
});
function Detail() { const { country, metricId } = Route.useParams(); const { data } = useSuspenseQuery(countryQuery(country)); const c = countryByCode(country); const m = data?.metrics.find(m => m.id === metricId); if (!c || !m) return null; return <CountryShell country={c}><CountryMetricDetail country={c} metric={m} history={false} /></CountryShell>; }
