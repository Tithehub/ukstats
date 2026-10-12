import { createFileRoute } from "@tanstack/react-router";
import { goldReserves } from "@/lib/gold.server";
import { GOLD_SOURCE } from "@/lib/gold";

/** Open read-only API: official gold reserves by country (IMF IRFCL). ?format=csv for CSV. */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Cache-Control": "public, max-age=3600, s-maxage=3600" };

export const Route = createFileRoute("/api/public/v1/gold")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const { table, fetchedAt, error } = await goldReserves();
        if (!table) return Response.json({ status: "no_feed", source: GOLD_SOURCE, error }, { status: 503, headers: CORS });
        const rows = table.ranked.map((r, i) => ({ rank: i + 1, iso3: r.iso3, country: r.name, tonnes: Math.round(r.tonnes * 10) / 10, ounces: r.ounces, period: r.period }));
        if (new URL(request.url).searchParams.get("format") === "csv") {
          const csv = ["rank,iso3,country,tonnes,ounces,period", ...rows.map((r) => [r.rank, r.iso3, `"${r.country.replace(/"/g, '""')}"`, r.tonnes, r.ounces, r.period].join(","))].join("\n");
          return new Response(csv, { headers: { ...CORS, "Content-Type": "text/csv; charset=utf-8" } });
        }
        return Response.json({ source: GOLD_SOURCE, fetchedAt, rows, notRanked: table.flagged.map((r) => ({ iso3: r.iso3, country: r.name, reportedOunces: r.ounces, period: r.period })) }, { headers: CORS });
      },
    },
  },
});
