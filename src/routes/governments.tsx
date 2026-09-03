import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getGovernmentEras } from "@/lib/uk-stats.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/governments")({
  head: () => ({
    meta: [
      { title: "UK statistics by government: start vs end values" },
      {
        name: "description",
        content:
          "Inflation, GDP growth, public sector net debt, tax, welfare and crime at the start and end of every UK government since 1979, using published ONS figures.",
      },
      { property: "og:title", content: "UK statistics by government" },
      {
        property: "og:description",
        content: "Published ONS figures at the start and end of each administration and prime ministerial term.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/governments" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/governments" }],
  }),
  loader: () => getGovernmentEras(),
  component: GovernmentsPage,
});

const PARTY_TONE: Record<string, string> = {
  Labour: "#e4003b",
  Conservative: "#0087dc",
  Coalition: "#faa61a",
};

const GOVERNMENTS = ["con-1979", "lab-1997", "coalition-2010", "con-2015", "lab-2024"];

const span = (from: string, to: string | null) =>
  `${new Date(from).getUTCFullYear()}–${to ? new Date(to).getUTCFullYear() : "present"}`;

function GovernmentsPage() {
  const { eras, fetchedAt } = Route.useLoaderData();
  const [view, setView] = useState<"governments" | "terms">("governments");
  const list = useMemo(
    () => eras.filter((e) => (view === "governments" ? GOVERNMENTS.includes(e.id) : !GOVERNMENTS.includes(e.id))),
    [eras, view],
  );
  const [selected, setSelected] = useState<string>(GOVERNMENTS[0]!);
  const [compare, setCompare] = useState<string | null>(null);

  const current = list.find((e) => e.id === selected) ?? list[0];
  const other = compare ? eras.find((e) => e.id === compare) : null;

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Politics &amp; polling</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Key statistics by government</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          The published value of each headline series on the day a government took office and the day it left, straight
          from the Office for National Statistics. Where a series is not published for a date, the nearest published
          period on or before it is shown and labelled — nothing is interpolated.
        </p>

        <div className="mt-6 inline-flex rounded-md border border-night-line/70 bg-night-panel p-1 font-mono text-[12px]">
          {(
            [
              ["governments", "Governments"],
              ["terms", "Prime ministerial terms"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                const first = eras.find((e) =>
                  v === "governments" ? GOVERNMENTS.includes(e.id) : !GOVERNMENTS.includes(e.id),
                );
                if (first) setSelected(first.id);
                setCompare(null);
              }}
              className={`rounded px-3 py-1.5 transition-colors ${
                view === v ? "bg-electric/15 text-electric-soft" : "text-night-muted hover:text-night-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e.id)}
              className={`rounded-md border px-3 py-2 text-left font-mono text-[12px] transition-colors ${
                current?.id === e.id
                  ? "border-electric bg-electric/10 text-electric-soft"
                  : "border-night-line/70 bg-night-panel text-night-muted hover:text-night-fg"
              }`}
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ background: PARTY_TONE[e.party] ?? "var(--color-electric)" }}
              />
              {e.pm.split(",")[0]} · {span(e.from, e.to)}
            </button>
          ))}
        </div>

        {current ? (
          <>
            <div className="mt-6 rounded-lg border border-night-line/70 bg-night-panel p-4">
              <h2 className="text-lg font-semibold">
                {current.name} · {span(current.from, current.to)}
              </h2>
              <p className="mt-1 font-mono text-[12px] text-night-muted">
                {current.party} · {current.pm} · {fmtDate(current.from)} to{" "}
                {current.to ? fmtDate(current.to) : "present"}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12px] text-night-muted">
              <label htmlFor="compare">Compare with</label>
              <select
                id="compare"
                value={compare ?? ""}
                onChange={(e) => setCompare(e.target.value || null)}
                className="rounded-md border border-night-line/70 bg-night px-3 py-2 outline-none focus:border-electric"
              >
                <option value="">No comparison</option>
                {eras
                  .filter((e) => e.id !== current.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.pm.split(",")[0]} · {span(e.from, e.to)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-night-line/70 bg-night-panel">
              <table className="w-full min-w-[720px] border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-night-line/70 text-night-muted">
                    <th className="px-3 py-2 text-left font-normal">Measure</th>
                    <th className="px-3 py-2 text-right font-normal">At start</th>
                    <th className="px-3 py-2 text-right font-normal">At end</th>
                    <th className="px-3 py-2 text-right font-normal">Change</th>
                    {other ? (
                      <th className="px-3 py-2 text-right font-normal">
                        {other.pm.split(",")[0]} change
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {current.rows.map((r, i) => {
                    const o = other?.rows[i];
                    return (
                      <tr key={r.metric} className="border-b border-night-line/40 align-top last:border-0">
                        <td className="px-3 py-3">
                          <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                            {r.metric}
                          </a>
                          <p className="mt-1 max-w-[380px] text-[11px] text-night-muted">{r.source}</p>
                          {r.note ? <p className="mt-1 max-w-[380px] text-[11px] text-night-muted">{r.note}</p> : null}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {r.startValue ?? "Not published"}
                          <p className="mt-1 text-[11px] text-night-muted">{r.startLabel ?? "—"}</p>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {r.endValue ?? "Not published"}
                          <p className="mt-1 text-[11px] text-night-muted">{r.endLabel ?? "—"}</p>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.change ?? "—"}</td>
                        {other ? <td className="px-3 py-3 text-right tabular-nums">{o?.change ?? "—"}</td> : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-4 max-w-3xl text-sm text-night-muted">
              Dates of each administration follow the House of Commons Library record of prime ministers and
              governments. CPI is published only from January 1989, so earlier boundaries show no CPI value rather than
              a substitute measure. Crime figures come from the Crime Survey for England and Wales, which began in 1981
              and was not run every year before 2001; the published survey period used is shown next to each value.
            </p>
            <p className="mt-2 font-mono text-[11px] text-night-muted">Read {fmtDate(fetchedAt)}</p>

            <div className="mt-10">
              <ShareRow title="UK key statistics by government" path="/governments" />
            </div>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
