import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { countryQuery } from '@/lib/country-queries';
import { countryHead } from '@/lib/country-detail';
import { CountryCard } from '@/components/CountryCard';
export const Route = createFileRoute('/$country/embed/$metricId')({
  loader: async ({ params, context }) => { const data = await context.queryClient.ensureQueryData(countryQuery(params.country)); if (!data?.metrics.some(m => m.id === params.metricId)) throw notFound(); return data; },
  head: ({ params }) => ({ ...countryHead(params.country, `${params.metricId} — live widget`, 'Embeddable official country statistic with provenance.'), meta: [...countryHead(params.country, `${params.metricId} — live widget`, 'Embeddable official country statistic with provenance.').meta, { name: 'robots', content: 'noindex' }] }),
  component: Widget,
  errorComponent: () => <p className="p-4">Feed temporarily unavailable.</p>,
  notFoundComponent: () => <p className="p-4">Figure not found.</p>,
});
function Widget() { const { country, metricId } = Route.useParams(); const data = Route.useLoaderData(); const m = data?.metrics.find(m => m.id === metricId); if (!data || !m) return null; return <main className="min-h-screen bg-night p-3 text-night-fg"><p className="mb-2 font-mono text-xs">{data.country.name} · UKStats</p><CountryCard m={m} embedded /><Link to="/$country/explained/$metricId" params={{ country, metricId }} target="_blank" className="mt-3 block text-xs text-electric-soft">Official figure and methodology ↗</Link></main>; }
