import { createFileRoute } from "@tanstack/react-router";
import { getUkStats } from "@/lib/uk-stats.functions";
import type { Metric } from "@/lib/uk-stats";

/**
 * Open read-only API for the whole register. Returns only already-published
 * public figures with provenance; no private data is reachable here.
 * ?format=csv for CSV, ?category=Finance to filter, ?id=uk-cpi for one metric.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

const FIELDS = ["id", "category", "subcategory", "title", "value", "sub", "period", "asOf", "nextDue", "cadence", "status", "source", "sourceUrl", "derivedFrom", "note"] as const;

function pick(m: Metric) {
  const o: Record<string, unknown> = {};
  for (const f of FIELDS) o[f] = (m as unknown as Record<string, unknown>)[f] ?? null;
  return o;
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const Route = createFileRoute("/api/public/v1/metrics")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id")?.slice(0, 100);
        const category = url.searchParams.get("category")?.slice(0, 100);
        const format = url.searchParams.get("format");
        const stats = await getUkStats();
        let rows = stats.metrics;
        if (id) rows = rows.filter((m) => m.id === id);
        if (category) rows = rows.filter((m) => m.category.toLowerCase() === category.toLowerCase());
        const data = rows.map(pick);
        if (format === "csv") {
          const body = [FIELDS.join(","), ...data.map((r) => FIELDS.map((f) => csvCell(r[f])).join(","))].join("\n");
          return new Response(body, { headers: { ...CORS, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'inline; filename="ukstats-register.csv"' } });
        }
        return Response.json(
          { publisher: "UKStats — UK National Data Register", licence: "Figures are as published by each official source; cite the source and UKStats.", fetchedAt: stats.fetchedAt, count: data.length, metrics: data },
          { headers: CORS },
        );
      },
    },
  },
});
