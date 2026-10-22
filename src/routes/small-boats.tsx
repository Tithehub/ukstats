import { createFileRoute } from "@tanstack/react-router";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HistoryChart } from "@/components/HistoryChart";
import { ShareRow } from "@/components/ShareRow";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Button } from "@/components/ui/button";
import { smallBoatsQuery } from "@/lib/small-boats.functions";
import { SMALL_BOATS_SOURCE, compareLatest, monthlyTotals, pmTotals, yearlyTotals, type DayRow } from "@/lib/small-boats";

const LAST7_PAGE = "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats/migrants-detected-crossing-the-english-channel-in-small-boats-last-7-days";

const T = "Small boat crossings, every day since 2018 | UKStats";
const D = "Every day of official Home Office small boat arrival figures since 1 January 2018, with yearly totals, totals under each Prime Minister and a free CSV download.";

export const Route = createFileRoute("/small-boats")({
  loader: ({ context }) => context.queryClient.ensureQueryData(smallBoatsQuery()),
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/small-boats" }],
  }),
  component: SmallBoatsPage,
  errorComponent: () => <main className="p-8">Small boat figures are unavailable right now. Please try again.</main>,
  notFoundComponent: () => <main className="p-8">Page not found.</main>,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const n = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 0 });

function SmallBoatsPage() {
  const { data } = useSuspenseQuery(smallBoatsQuery());
  const [shown, setShown] = useState(30);
  const derived = useMemo(() => {
    if (!data) return null;
    const s: DayRow[] = data.days?.length ? data.days : data.series;
    const provisional = s.filter((d) => d.provisional).length;
    return { months: monthlyTotals(s), years: yearlyTotals(s), pms: pmTotals(s), all: [...s].reverse(), cmp: compareLatest(s), provisional, seriesLast: data.series[data.series.length - 1]!.date, total: s.reduce((a, d) => a + d.arrivals, 0), first: s[0]!.date, last: s[s.length - 1]!.date };
  }, [data]);

  const download = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob(["date,migrants_arrived,boats_arrived,source\n" + (data.days?.length ? data.days : data.series).map((d: DayRow) => `${d.date},${d.arrivals},${d.boats},${d.provisional ? "last_7_days_provisional" : "time_series"}`).join("\n") + "\n"], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "uk-small-boat-arrivals-daily.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Small boat crossings, every day since 2018</h1>
        <p className="mt-2 max-w-2xl text-night-muted">{D}</p>
        <p className="mt-3 text-sm">
          Source: <a href={data?.fileUrl ?? SMALL_BOATS_SOURCE.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">{SMALL_BOATS_SOURCE.name}</a>. Provisional UK and French operational data, subject to revision by the Home Office. The time series is updated weekly; days after it come from the Home Office <a href={LAST7_PAGE} target="_blank" rel="noreferrer" className="text-electric-soft underline">last 7 days</a> page, published daily, and are marked provisional.
        </p>
        <ShareRow className="mt-4" path="/small-boats" title="Small boat crossings, every day since 2018" sourceUrl={SMALL_BOATS_SOURCE.url} sourceLabel="Home Office source" />
        <InstallPrompt className="mt-4" />
        <RestoreSignupCta />

        {!data || !derived ? (
          <div className="mt-8 rounded-md border border-night-line bg-night-panel p-6">
            <p className="font-semibold">No live feed</p>
            <p className="mt-1 text-sm text-night-muted">
              The Home Office spreadsheet could not be read just now, so no figures are shown rather than old or estimated ones. See the <a href={SMALL_BOATS_SOURCE.url} className="text-electric-soft underline" target="_blank" rel="noreferrer">official page</a>.
            </p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-3">
              <Stat label="People arrived since 1 Jan 2018" value={n(derived.total)} />
              <Stat label="Latest published day" value={day(derived.last)} />
              <Stat label="Published by the Home Office" value={data.published ? day(data.published.slice(0, 10)) : "Not stated"} />
            </section>

            {derived.provisional > 0 && (
              <p className="mt-3 font-mono text-[11px] text-night-muted">
                Includes {derived.provisional} provisional day{derived.provisional === 1 ? "" : "s"} after {day(derived.seriesLast)} from the daily last 7 days page{data.recentPublished ? `, published ${day(data.recentPublished.slice(0, 10))}` : ""}.
              </p>
            )}

            {derived.cmp && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">How the latest day compares</h2>
                <p className="mt-1 text-sm text-night-muted">Plain arithmetic on the published daily figures. An average is left blank if any day in its window is missing.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <Stat label={`People on ${day(derived.cmp.latest.date)}`} value={n(derived.cmp.latest.arrivals)} />
                  <Stat label="Daily average, previous 7 days" value={derived.cmp.avg7 === null ? "Not available" : derived.cmp.avg7.toLocaleString("en-GB", { maximumFractionDigits: 1 })} />
                  <Stat label="Daily average, previous 30 days" value={derived.cmp.avg30 === null ? "Not available" : derived.cmp.avg30.toLocaleString("en-GB", { maximumFractionDigits: 1 })} />
                  <Stat label={`Last 7 days vs ${day(derived.cmp.sameWeekFrom)} – ${day(derived.cmp.sameWeekTo)}`} value={`${n(derived.cmp.last7)} vs ${derived.cmp.sameWeekLastYear === null ? "n/a" : n(derived.cmp.sameWeekLastYear)}`} />
                </div>
              </section>
            )}

            <section className="mt-8 rounded-md border border-night-line bg-night-panel p-4">
              <h2 className="mb-3 text-lg font-semibold">People arriving each month</h2>
              <HistoryChart points={derived.months} unit="people" />
              <p className="mt-2 font-mono text-[11px] text-night-muted">The latest month runs only to {day(derived.last)}.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Under each Prime Minister</h2>
              <p className="mt-1 text-sm text-night-muted">Totals of the official daily figures for each term. The handover day counts for the incoming Prime Minister. Term dates from GOV.UK. No cost figures are shown, because no official cost per crossing is published.</p>
              <Table head={["Prime Minister", "Days", "People", "Boats", "People a day"]}>
                {derived.pms.map((r) => (
                  <tr key={r.name}>
                    <td className="px-3 py-2"><a href={r.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">{r.name}</a>{r.partial && <span className="block text-xs text-night-muted">Counted {r.partial.replace(/\d{4}-\d{2}-\d{2}/g, day)}</span>}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(r.days)}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(r.arrivals)}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(r.boats)}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.perDay.toLocaleString("en-GB", { maximumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </Table>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Each year</h2>
              <Table head={["Year", "People", "Boats", "Days covered"]}>
                {derived.years.map((y) => (
                  <tr key={y.year}>
                    <td className="px-3 py-2">{y.year}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(y.arrivals)}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(y.boats)}</td>
                    <td className="px-3 py-2 text-right font-mono">{y.days}</td>
                  </tr>
                ))}
              </Table>
            </section>

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Day by day</h2>
                <Button variant="outline" size="sm" onClick={download}><Download className="mr-1 h-4 w-4" />Download every day (CSV)</Button>
              </div>
              <Table head={["Date", "People", "Boats"]}>
                {derived.all.slice(0, shown).map((d) => (
                  <tr key={d.date}>
                    <td className="px-3 py-2">{day(d.date)}{d.provisional && <span className="ml-2 font-mono text-[10px] uppercase text-night-muted">provisional</span>}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(d.arrivals)}</td>
                    <td className="px-3 py-2 text-right font-mono">{n(d.boats)}</td>
                  </tr>
                ))}
              </Table>
              {shown < derived.all.length && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShown((v) => v + 90)}>Show 90 more days</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShown(derived.all.length)}>Show every day since 2018</Button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-night-line bg-night-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-night-line">
      <table className="w-full text-sm">
        <thead className="bg-night-panel text-left font-mono text-[11px] uppercase tracking-wider text-night-muted">
          <tr>{head.map((h, i) => <th key={h} className={`px-3 py-2 ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-night-line">{children}</tbody>
      </table>
    </div>
  );
}
