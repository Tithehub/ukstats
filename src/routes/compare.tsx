import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows, ExternalLink } from "lucide-react";
import { getMetricHistory, getUkStats } from "@/lib/uk-stats.functions";
import type { HistoryPayload } from "@/lib/uk-stats";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/compare")({
  loader: () => getUkStats(),
  head: () => ({
    meta: [
      { title: "Compare any two figures — UKStats" },
      {
        name: "description",
        content:
          "Chart any two official UK statistics side by side over their full published history, each indexed to 100 at its first shown point.",
      },
      { property: "og:title", content: "Compare any two figures — UKStats" },
      {
        property: "og:description",
        content: "Chart any two official UK statistics side by side over their full published history.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/compare" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/compare" }],
  }),
  component: ComparePage,
});

const COLORS = ["#3b82f6", "#f59e0b"] as const;

function useHistory(id: string | null) {
  return useQuery({
    queryKey: ["compare-history", id],
    queryFn: () => getMetricHistory({ data: { id: id! } }),
    enabled: Boolean(id),
    staleTime: 60 * 60_000,
  });
}

function ComparePage() {
  const { metrics } = Route.useLoaderData();
  const options = useMemo(
    () => metrics.filter((m) => m.hasHistory).sort((a, b) => a.title.localeCompare(b.title)),
    [metrics],
  );
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const a = useHistory(aId);
  const b = useHistory(bId);

  const series = [a.data, b.data].filter((s): s is HistoryPayload => Boolean(s && s.points.length > 1));

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="h-6 w-6 text-electric" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compare two figures</h1>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted text-pretty">
          Pick any two figures with a published history and chart them together. Because the units differ, each series
          is indexed to 100 at its own first shown point — the chart compares direction and pace, not levels. Every
          point is exactly as its publisher released it.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {([["First figure", aId, setAId, a], ["Second figure", bId, setBId, b]] as const).map(
            ([label, id, setId, query], i) => (
              <div key={label} className="rounded-xl border border-night-line bg-night-panel p-4">
                <label className="font-mono text-[11px] uppercase tracking-wider text-night-muted" htmlFor={`cmp-${i}`}>
                  {label}
                </label>
                <select
                  id={`cmp-${i}`}
                  value={id ?? ""}
                  onChange={(e) => setId(e.target.value || null)}
                  className="mt-2 w-full rounded-lg border border-night-line bg-night px-3 py-2.5 text-[14px] text-night-fg focus:border-electric focus:outline-none"
                >
                  <option value="">Choose a figure…</option>
                  {options.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {m.source}
                    </option>
                  ))}
                </select>
                {id && query.isLoading && (
                  <p className="mt-2 font-mono text-[11px] text-night-muted">Loading published series…</p>
                )}
                {id && query.data && query.data.points.length < 2 && (
                  <p className="mt-2 font-mono text-[11px] text-ageing">
                    This figure has too few published observations to chart.
                  </p>
                )}
              </div>
            ),
          )}
        </div>

        {series.length === 2 && <CompareChart a={series[0]!} b={series[1]!} />}

        {series.length < 2 && (
          <p className="mt-8 rounded-xl border border-dashed border-night-line p-8 text-center font-mono text-[12px] text-night-muted">
            Choose two figures above to draw the comparison.
          </p>
        )}

        <p className="mt-6 font-mono text-[11px] text-night-muted">
          Want one series on its own? <Link to="/register" className="text-electric hover:underline">Open the full register</Link> and
          pick any figure's history.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function CompareChart({ a, b }: { a: HistoryPayload; b: HistoryPayload }) {
  const w = 720;
  const h = 300;
  const padL = 48;
  const padB = 26;
  const padT = 14;

  const lines = [a, b].map((s, i) => {
    const pts = s.points;
    const base = pts[0]!.value || 1;
    const norm = pts.map((p) => (p.value / base) * 100);
    const min = Math.min(...norm);
    const max = Math.max(...norm);
    return { s, pts, norm, min, max, color: COLORS[i]! };
  });

  const lo = Math.min(...lines.map((l) => l.min));
  const hi = Math.max(...lines.map((l) => l.max));
  const span = hi - lo || 1;
  const y = (v: number) => padT + (1 - (v - lo) / span) * (h - padT - padB);

  return (
    <div className="mt-8 rounded-xl border border-night-line bg-night-panel p-4 sm:p-6">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {lines.map((l) => (
          <div key={l.s.id} className="flex items-start gap-2">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
            <div>
              <p className="text-[13px] font-medium leading-tight">{l.s.title}</p>
              <p className="font-mono text-[10px] text-night-muted">
                {l.pts[0]!.label}: {l.pts[0]!.formatted} → {l.pts[l.pts.length - 1]!.label}:{" "}
                {l.pts[l.pts.length - 1]!.formatted} · {l.s.source}
              </p>
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-4 w-full"
        role="img"
        aria-label={`Comparison of ${a.title} and ${b.title}, each indexed to 100 at its first point`}
      >
        {[hi, lo + span / 2, lo].map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - 8} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.12" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.55">
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        {lines.map((l) => {
          const x = (i: number) => padL + (i / (l.norm.length - 1)) * (w - padL - 8);
          const d = l.norm.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          return <path key={l.s.id} d={d} fill="none" stroke={l.color} strokeWidth="2" />;
        })}
      </svg>
      <p className="mt-2 font-mono text-[10px] text-night-muted">
        Index: first published observation = 100 for each series. Time axes are independent — each line spans its own
        full published history.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {lines.map((l) => (
          <a
            key={l.s.id}
            href={l.s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-electric hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {l.s.source} — original release
          </a>
        ))}
      </div>
    </div>
  );
}
