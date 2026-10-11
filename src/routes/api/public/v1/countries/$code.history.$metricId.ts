import { createFileRoute } from '@tanstack/react-router';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'public, max-age=300' };
export const Route = createFileRoute('/api/public/v1/countries/$code/history/$metricId')({ server: { handlers: {
  OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
  GET: async ({ params, request }) => {
    const { loadCountryHistory } = await import('@/lib/countries.server');
    const m = await loadCountryHistory(params.code, params.metricId);
    if (!m) return Response.json({ error: 'Figure not found' }, { status: 404, headers: CORS });
    if (new URL(request.url).searchParams.get('format') === 'csv') {
      const { observationsCsv } = await import('@/lib/country-detail');
      return new Response(observationsCsv(m), { headers: { ...CORS, 'Content-Type': 'text/csv; charset=utf-8' } });
    }
    return Response.json({ country: params.code, metric: m, fetchedAt: new Date().toISOString() }, { headers: CORS });
  },
} } });
