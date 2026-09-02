import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getMetricHistory } from "@/lib/uk-stats.functions";
import { fmtDate, type HistoryPayload } from "@/lib/uk-stats";
import { HistoryChart } from "@/components/HistoryChart";
import { ShareRow } from "@/components/ShareRow";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/history/$metricId")({
  loader: async ({ params }) => {
    const data = await getMetricHistory({ data: { id: params.metricId } });
    if (!data) throw notFound();
    return data as HistoryPayload;
  },
  head: ({ params, loaderData }) => {
    const url = `https://ukstats.co.uk/history/${params.metricId}`;
    if (!loaderData) {
      return { meta: [{ title: "Series unavailable — UKStats" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — full published history`;
    const description = `Every published observation of ${loaderData.title.toLowerCase()} from ${
      loaderData.points[0]?.label ?? "the first release"
    } to ${loaderData.points[loaderData.points.length - 1]?.label ?? "today"}, straight from ${loaderData.source}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: HistoryPage,
  notFoundComponent: MissingSeries,
});

function MissingSeries() {
  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">No published series for this figure</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-night-muted text-pretty">
          Full history is available where the issuing body publishes a machine-readable time series. This figure does
          not have one here — the register shows it with its source, period and next release instead.
        </p>
        <Link to="/register" className="mt-6 inline-block font-mono text-[12px] text-electric hover:underline">
          Back to the full register →
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

const PAGE = 50;

function HistoryPage() {
  const data = Route.useLoaderData();
  const [page, setPage] = useState(0);
  const [newestFirst, setNewestFirst] = useState(true);

  const rows = useMemo(() => {
    const list = newestFirst ? [...data.points].reverse() : data.points;
    return list.slice(page * PAGE, page * PAGE + PAGE);
  }, [data.points, page, newestFirst]);
  const pages = Math.ceil(data.points.length / PAGE);
  const latest = data.points[data.points.length - 1];

  function downloadCsv() {
    const csv = [
      "period,value,last_updated",
      ...data.points.map((p) => `${JSON.stringify(p.label)},${p.value},${p.updated ?? ""}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <nav className="font-mono text-[11px] text-night-muted">
          <Link to="/register" className="hover:text-electric-soft">
            Register
          </Link>
          <span className="px-1.5">/</span>
          <span>{data.category}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{data.title}</h1>
        <p className="mt-1 font-mono text-[11px] text-night-muted">
          {data.seriesTitle} · {data.sub ?? data.cadence}
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-xl border border-night-line/60 bg-night-panel/60 p-4">
            <HistoryChart points={data.points} unit={data.unit} />
          </section>

          <aside className="rounded-xl border border-night-line/60 bg-night-panel/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Latest published</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{latest?.formatted ?? "—"}</p>
            <p className="font-mono text-[11px] text-night-muted">{latest?.label}</p>
            <dl className="mt-4 space-y-2 border-t border-night-line/50 pt-4 font-mono text-[11px] text-night-muted">
              <div className="flex justify-between gap-3">
                <dt>Issuing body</dt>
                <dd className="text-right text-night-fg">{data.source}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Series starts</dt>
                <dd className="text-right text-night-fg">{data.points[0]?.label ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Observations</dt>
                <dd className="text-right text-night-fg">{data.points.length.toLocaleString("en-GB")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Cadence</dt>
                <dd className="text-right text-night-fg">{data.cadence}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Next release</dt>
                <dd className="text-right text-night-fg">
                  {data.nextDue ? fmtDate(data.nextDue) : "not announced"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Pulled</dt>
                <dd className="text-right text-night-fg">{new Date(data.fetchedAt).toLocaleString("en-GB")}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-md bg-electric px-3 py-2 text-[12px] font-medium text-night hover:opacity-90"
              >
                Download CSV
              </button>
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-night-line px-3 py-2 text-[12px] font-medium text-night-fg hover:border-electric"
              >
                Open the source ↗
              </a>
            </div>
          </aside>
        </div>

        <ShareRow
          className="mt-5"
          path={`/history/${data.id}`}
          title={`${data.title}: ${latest?.formatted ?? ""} (${latest?.label ?? ""}) — official ${data.source} series`}
          sourceUrl={data.sourceUrl}
        />

        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Every published observation</h2>
            <button
              type="button"
              onClick={() => {
                setNewestFirst((v) => !v);
                setPage(0);
              }}
              className="rounded-md border border-night-line/60 px-2 py-1 font-mono text-[11px] text-night-muted hover:border-electric hover:text-electric-soft"
            >
              {newestFirst ? "Newest first" : "Oldest first"}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-night-line/60">
            <table className="w-full font-mono text-[12px]">
              <thead className="bg-night-panel/70 text-night-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Period
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Published value
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Last updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.label} className="border-t border-night-line/40">
                    <td className="px-3 py-1.5">{p.label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-night-fg">{p.formatted}</td>
                    <td className="px-3 py-1.5 text-right text-night-muted">{p.updated ? fmtDate(p.updated) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-night-muted">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-night-line/60 px-2 py-1 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span>
              Page {page + 1} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              className="rounded-md border border-night-line/60 px-2 py-1 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </section>
      </main>
      <SiteFooter fetchedAt={data.fetchedAt} />
    </div>
  );
}
