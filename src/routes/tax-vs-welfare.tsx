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
      { title: "UK total tax receipts vs the total welfare bill" },
      {
        name: "description",
        content:
          "Total UK public sector current receipts compared with the total welfare bill (net social benefits), every published year, straight from the ONS public sector finances release.",
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

function TaxVsWelfarePage() {
  const { points, asOf, nextDue, lastCompleteYear } = Route.useLoaderData();
  const [hover, setHover] = useState<number | null>(null);

  const usable = useMemo(
    () => points.filter((p) => p.receipts !== null || p.welfare !== null),
    [points],
  );
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
    const values = usable.flatMap((p) => [p.receipts, p.welfare]).filter((v): v is number => v !== null);
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
      receipts: path((i) => usable[i]!.receipts, 0, solidEnd),
      welfare: path((i) => usable[i]!.welfare, 0, solidEnd),
      receiptsPartial: partialIdx > 0 ? path((i) => usable[i]!.receipts, solidEnd, partialIdx) : "",
      welfarePartial: partialIdx > 0 ? path((i) => usable[i]!.welfare, solidEnd, partialIdx) : "",
    };
  }, [usable]);

  function csv() {
    const rows = [
      "Year,Total current receipts (£m),Net social benefits (£m),Coverage",
      ...usable.map(
        (p) =>
          `${p.year},${p.receipts ?? ""},${p.welfare ?? ""},${p.partial ? `${p.monthsCovered} part year` : "Full year"}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "uk-tax-vs-welfare.csv";
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
          Public sector total current receipts against public sector net social benefits paid, in cash terms, for every
          year the ONS publishes. No figure is adjusted, deflated or estimated here.
        </p>

        {!chart ? (
          <p className="mt-8 rounded-lg border border-night-line/70 bg-night-panel p-6 font-mono text-[13px] text-overdue">
            No live feed. The published series could not be read for this request.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="Total receipts" value={active?.receipts !== null && active ? bn(active.receipts!) : "—"} note={active?.year ?? ""} />
              <Stat label="Total welfare bill" value={active?.welfare !== null && active ? bn(active.welfare!) : "—"} note={active?.year ?? ""} />
              <Stat
                label="Welfare as a share of receipts"
                value={
                  active && active.receipts && active.welfare
                    ? `${((active.welfare / active.receipts) * 100).toFixed(1)}%`
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
                  <span className="inline-block h-0.5 w-5 bg-electric" /> Total current receipts
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-5 bg-overdue" /> Net social benefits (welfare)
                </span>
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
                {usable.length} published years · last revised {fmtDate(asOf)} · next release{" "}
                {nextDue ? fmtDate(nextDue) : "not announced"}
              </span>
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
