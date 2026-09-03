import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getTaxVsWelfare } from "@/lib/uk-stats.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/tax-vs-welfare")({
  head: () => ({
    meta: [
      { title: "UK tax receipts and income tax vs the total welfare bill" },
      {
        name: "description",
        content:
          "Total UK public sector current receipts, and income tax alone, compared with the total welfare bill (net social benefits), every published year, straight from the ONS public sector finances release.",
      },
      { property: "og:title", content: "UK tax receipts vs the welfare bill" },
      {
        property: "og:description",
        content: "Published annual public sector receipts against net social benefits paid, in cash terms.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/tax-vs-welfare" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/tax-vs-welfare" }],
  }),
  loader: () => getTaxVsWelfare(),
  component: TaxVsWelfarePage,
});

const bn = (m: number) => `£${(m / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}bn`;

type Mode = "receipts" | "incomeTax";

function TaxVsWelfarePage() {
  const { points, asOf, nextDue, lastCompleteYear, incomeTaxFrom } = Route.useLoaderData();
  const [hover, setHover] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("receipts");

  const taxLabel = mode === "receipts" ? "Total receipts" : "Income tax";
  const usable = useMemo(
    () =>
      mode === "receipts"
        ? points.filter((p) => p.receipts !== null || p.welfare !== null)
        : points.filter((p) => p.incomeTax !== null),
    [points, mode],
  );
  const taxOf = (p: (typeof points)[number]) => (mode === "receipts" ? p.receipts : p.incomeTax);
  const latest = usable[usable.length - 1];
  const partYear = useMemo(() => usable.find((p) => p.partial), [usable]);
  const yearLabel = (p: (typeof usable)[number]) =>
    p.partial ? `${p.year} (${p.monthsCovered}, part year)` : p.year;


  const chart = useMemo(() => {
    const w = 900;
    const h = 340;
    const padL = 64;
    const padB = 30;
    const padT = 14;
    const values = usable.flatMap((p) => [taxOf(p), p.welfare]).filter((v): v is number => v !== null);
    if (values.length < 2) return null;
    const max = Math.max(...values);
    const x = (i: number) => padL + (i * (w - padL - 8)) / Math.max(1, usable.length - 1);
    const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);
    const path = (pick: (i: number) => number | null, from = 0, to = usable.length - 1) => {
      let d = "";
      let open = false;
      for (let i = from; i <= to; i++) {
        const v = pick(i);
        if (v === null) {
          open = false;
          continue;
        }
        d += `${open ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
        open = true;
      }
      return d.trim();
    };
    const partialIdx = usable.findIndex((p) => p.partial);
    const solidEnd = partialIdx > 0 ? partialIdx - 1 : usable.length - 1;
    return {
      w,
      h,
      padL,
      padB,
      padT,
      max,
      x,
      y,
      partialIdx,
      receipts: path((i) => taxOf(usable[i]!), 0, solidEnd),
      welfare: path((i) => usable[i]!.welfare, 0, solidEnd),
      receiptsPartial: partialIdx > 0 ? path((i) => taxOf(usable[i]!), solidEnd, partialIdx) : "",
      welfarePartial: partialIdx > 0 ? path((i) => usable[i]!.welfare, solidEnd, partialIdx) : "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable, mode]);

  function csv() {
    const header =
      mode === "receipts" ? "Total current receipts (£m)" : "Income tax: PAYE + self assessed + other (£m)";
    const rows = [
      `Year,${header},Net social benefits (£m),Coverage`,
      ...usable.map(
        (p) =>
          `${p.year},${taxOf(p) ?? ""},${p.welfare ?? ""},${p.partial ? `${p.monthsCovered} part year` : "Full year"}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "receipts" ? "uk-tax-vs-welfare.csv" : "uk-income-tax-vs-welfare.csv";
    a.click();
    URL.revokeObjectURL(url);
  }


  const active = hover !== null ? usable[hover] : latest;

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Fiscal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Total tax vs the total welfare bill</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Public sector total current receipts — or income tax alone — against public sector net social benefits paid,
          in cash terms, for every year the ONS publishes. No figure is adjusted, deflated or estimated here.
        </p>

        <div
          role="group"
          aria-label="Choose the tax measure"
          className="mt-5 inline-flex rounded-md border border-night-line/70 p-1 font-mono text-[12px]"
        >
          {(
            [
              { key: "receipts", label: "Total receipts" },
              { key: "incomeTax", label: "Income tax" },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={mode === o.key}
              onClick={() => {
                setMode(o.key);
                setHover(null);
              }}
              className={`rounded px-3 py-1.5 transition-colors ${
                mode === o.key ? "bg-electric/15 text-electric-soft" : "text-night-muted hover:text-night-fg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {mode === "incomeTax" ? (
          <p className="mt-3 max-w-2xl font-mono text-[12px] text-night-muted">
            Income tax here is the ONS&rsquo;s own published components added together: PAYE income tax (MS6W), self
            assessed income tax (LISB) and other income tax (MF6X). Published from {incomeTaxFrom ?? "—"} onwards, so
            this view is shorter than the total receipts series.
          </p>
        ) : null}


        {!chart ? (
          <p className="mt-8 rounded-lg border border-night-line/70 bg-night-panel p-6 font-mono text-[13px] text-overdue">
            No live feed. The published series could not be read for this request.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat
                label={taxLabel}
                value={active && taxOf(active) !== null ? bn(taxOf(active)!) : "—"}
                note={active ? yearLabel(active) : ""}
              />
              <Stat
                label="Total welfare bill"
                value={active?.welfare !== null && active ? bn(active.welfare!) : "—"}
                note={active ? yearLabel(active) : ""}
              />
              <Stat
                label={`Welfare as a share of ${mode === "receipts" ? "receipts" : "income tax"}`}
                value={
                  active && taxOf(active) && active.welfare
                    ? `${((active.welfare / taxOf(active)!) * 100).toFixed(1)}%`
                    : "—"
                }
                note="Arithmetic on the two published totals"
              />
            </div>


            <figure className="mt-6 rounded-lg border border-night-line/70 bg-night-panel p-4">
              <svg
                viewBox={`0 0 ${chart.w} ${chart.h}`}
                className="w-full"
                role="img"
                aria-label="Total public sector current receipts against net social benefits, by year"
                onMouseLeave={() => setHover(null)}
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const v = chart.max * t;
                  return (
                    <g key={t}>
                      <line
                        x1={chart.padL}
                        x2={chart.w - 8}
                        y1={chart.y(v)}
                        y2={chart.y(v)}
                        stroke="currentColor"
                        strokeOpacity={0.12}
                      />
                      <text x={4} y={chart.y(v) + 4} className="fill-current font-mono text-[11px] opacity-60">
                        {bn(v)}
                      </text>
                    </g>
                  );
                })}
                <path d={chart.receipts} fill="none" stroke="var(--color-electric)" strokeWidth={2} />
                <path d={chart.welfare} fill="none" stroke="var(--color-overdue)" strokeWidth={2} />
                {chart.receiptsPartial ? (
                  <path
                    d={chart.receiptsPartial}
                    fill="none"
                    stroke="var(--color-electric)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    strokeOpacity={0.75}
                  />
                ) : null}
                {chart.welfarePartial ? (
                  <path
                    d={chart.welfarePartial}
                    fill="none"
                    stroke="var(--color-overdue)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    strokeOpacity={0.75}
                  />
                ) : null}

                {usable.map((p, i) => (
                  <rect
                    key={p.year}
                    x={chart.x(i) - 4}
                    y={chart.padT}
                    width={8}
                    height={chart.h - chart.padT - chart.padB}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                  />
                ))}
                {hover !== null ? (
                  <line
                    x1={chart.x(hover)}
                    x2={chart.x(hover)}
                    y1={chart.padT}
                    y2={chart.h - chart.padB}
                    stroke="currentColor"
                    strokeOpacity={0.35}
                  />
                ) : null}
                {usable
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i % Math.ceil(usable.length / 10) === 0)
                  .map(({ p, i }) => (
                    <text
                      key={p.year}
                      x={chart.x(i)}
                      y={chart.h - 8}
                      textAnchor="middle"
                      className="fill-current font-mono text-[11px] opacity-60"
                    >
                      {p.year}
                    </text>
                  ))}
              </svg>
              <figcaption className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-night-muted">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-5 bg-electric" />{" "}
                  {mode === "receipts" ? "Total current receipts" : "Income tax (PAYE + self assessed + other)"}
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-5 bg-overdue" /> Net social benefits (welfare)
                </span>
                {partYear ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-0.5 w-5 bg-current opacity-70"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px)",
                        backgroundColor: "transparent",
                      }}
                    />{" "}
                    Dashed = {partYear.year} part year ({partYear.monthsCovered} only)
                  </span>
                ) : null}
              </figcaption>
            </figure>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[12px] text-night-muted">
              <button
                type="button"
                onClick={csv}
                className="rounded-md border border-night-line/70 px-3 py-2 transition-colors hover:border-electric hover:text-electric-soft"
              >
                Download CSV
              </button>
              <span>
                {usable.length} published years · last complete year {lastCompleteYear ?? "—"}
                {partYear ? ` · ${partYear.year} covers ${partYear.monthsCovered} only` : ""} · last revised{" "}
                {fmtDate(asOf)} · next release {nextDue ? fmtDate(nextDue) : "not announced"}
              </span>
            </div>

            <h2 className="mt-10 text-lg font-semibold">Year by year</h2>
            <p className="mt-2 max-w-2xl text-sm text-night-muted">
              Every year the ONS publishes, in cash terms. Part-year rows are the publisher&rsquo;s own monthly figures
              added together — nothing is annualised or projected.
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-night-line/70 bg-night-panel">
              <table className="w-full min-w-[520px] border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-night-line/70 text-night-muted">
                    <th className="px-3 py-2 text-left font-normal">Year</th>
                    <th className="px-3 py-2 text-right font-normal">{taxLabel}</th>
                    <th className="px-3 py-2 text-right font-normal">Welfare bill</th>
                    <th className="px-3 py-2 text-right font-normal">
                      Welfare / {mode === "receipts" ? "receipts" : "income tax"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...usable].reverse().map((p) => (
                    <tr key={p.year} className="border-b border-night-line/40 last:border-0">
                      <td className="px-3 py-2 text-left tabular-nums">
                        {p.year}
                        {p.partial ? (
                          <span className="ml-2 rounded border border-night-line/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-night-muted">
                            {p.monthsCovered} part year
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{taxOf(p) !== null ? bn(taxOf(p)!) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.welfare !== null ? bn(p.welfare) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {taxOf(p) && p.welfare ? `${((p.welfare / taxOf(p)!) * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            <h2 className="mt-10 text-lg font-semibold">Official sources</h2>
            <ul className="mt-3 grid gap-2 font-mono text-[12px] text-night-muted">
              {[
                {
                  label: "ONS · PS: Total current receipts (ANBT)",
                  url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anbt/pusf",
                },
                {
                  label: "ONS · PS: Net social benefits (ANLY)",
                  url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anly/pusf",
                },
                {
                  label: "ONS · CG: PAYE income tax (MS6W)",
                  url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/ms6w/pusf",
                },
                {
                  label: "ONS · CG: Self assessed income tax (LISB)",
                  url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/lisb/pusf",
                },
                {
                  label: "ONS · CG: Other income tax (MF6X)",
                  url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/mf6x/pusf",
                },
                {
                  label: "HMRC · Tax receipts and National Insurance contributions",
                  url: "https://www.gov.uk/government/statistics/hmrc-tax-and-nics-receipts-for-the-uk",
                },
                {
                  label: "DWP · Benefit expenditure and caseload tables",
                  url: "https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2025",
                },
                {
                  label: "OBR · Economic and fiscal outlook",
                  url: "https://obr.uk/publications/",
                },
              ].map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <ShareRow title="UK tax receipts vs the welfare bill" path="/tax-vs-welfare" />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-night-line/70 bg-night-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-night-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 font-mono text-[11px] text-night-muted">{note}</p>
    </div>
  );
}
