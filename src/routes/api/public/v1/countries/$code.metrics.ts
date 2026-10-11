import { createFileRoute } from '@tanstack/react-router';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'public, max-age=300' };
export const Route = createFileRoute('/api/public/v1/countries/$code/metrics')({ server: { handlers: {
  OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
  GET: async ({ params, request }) => {
    const { loadCountryStats } = await import('@/lib/countries.server');
    const stats = await loadCountryStats(params.code);
    if (!stats) return Response.json({ error: 'Country not found' }, { status: 404, headers: CORS });
    const url = new URL(request.url); const id = url.searchParams.get('id'); const category = url.searchParams.get('category');
    const metrics = stats.metrics.filter(m => (!id || m.id === id) && (!category || m.category?.toLowerCase() === category.toLowerCase()));
    if (url.searchParams.get('format') === 'csv') {
      const fields = ['id','category','title','value','raw','period','asOf','cadence','next','status','source','sourceUrl','note'] as const;
      const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return new Response([fields.join(','), ...metrics.map(m => fields.map(f => cell(m[f])).join(','))].join('\n'), { headers: { ...CORS, 'Content-Type': 'text/csv; charset=utf-8' } });
    }
    return Response.json({ ...stats, metrics, count: metrics.length, licence: 'Cite each original publisher; source-specific licences apply.' }, { headers: CORS });
  },
} } });
