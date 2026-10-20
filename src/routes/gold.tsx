import { createFileRoute, Link } from "@tanstack/react-router";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { goldQuery } from "@/lib/gold.functions";
import { GOLD_SOURCE, goldPeriodLabel, flagEmoji } from "@/lib/gold";
import { ShareRow } from "@/components/ShareRow";

const T = "Which countries hold the most gold? Official reserves | UK Stats";
const D = "Official gold reserves by country, in tonnes, from central-bank filings to the IMF — with the month each figure covers and a link to the source.";

export const Route = createFileRoute("/gold")({
  loader: ({ context }) => context.queryClient.ensureQueryData(goldQuery()),
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "article" }, { property: "og:url", content: "https://stats.solutions/gold" }, { property: "og:image", content: "https://ukstats.co.uk/og/gold.jpg" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://ukstats.co.uk/og/gold.jpg" }],
    links: [{ rel: "canonical", href: "https://stats.solutions/gold" }],
  }),
  component: GoldPage,
  errorComponent: () => <main className="p-8">Gold reserves are unavailable right now. Please try again.</main>,
});

const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function GoldPage() {
  const { data } = useSuspenseQuery(goldQuery());
  const t = data.table;
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Official gold reserves by country</h1>
        <p className="mt-2 max-w-2xl text-night-muted">{D}</p>
        <p className="mt-3 text-sm">
          Source: <a href={GOLD_SOURCE.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">{GOLD_SOURCE.name}</a>. {GOLD_SOURCE.indicator}, converted at 32,150.7466 troy ounces per tonne. Updated monthly by the IMF as countries file.
        </p>
        <ShareRow className="mt-4" path="/gold" title="Which countries hold the most gold? Official reserves" sourceUrl={GOLD_SOURCE.url} sourceLabel="IMF source" />
        <RestoreSignupCta />
        {!t ? (
          <div className="mt-8 rounded-md border border-night-line bg-night-panel p-6">
            <p className="font-semibold">No live feed</p>
            <p className="mt-1 text-sm text-night-muted">The IMF reserves service did not answer just now, so no figures are shown rather than old or estimated ones. Check the <a href={GOLD_SOURCE.url} className="text-electric-soft underline" target="_blank" rel="noreferrer">IMF dataset</a> directly.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-x-auto rounded-md border border-night-line">
              <table className="w-full text-sm">
                <thead className="bg-night-panel text-left font-mono text-[11px] uppercase tracking-wider text-night-muted">
                  <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Country</th><th className="px-3 py-2 text-right">Tonnes</th><th className="px-3 py-2">Month covered</th></tr>
                </thead>
                <tbody className="divide-y divide-night-line">
                  {t.ranked.map((r, i) => (
                    <tr key={r.iso3} className={r.site !== null ? "bg-electric/5" : undefined}>
                      <td className="px-3 py-2 font-mono text-night-muted">{i + 1}</td>
                      <td className="px-3 py-2">
                        {flagEmoji(r.iso3) && <span className="mr-2" aria-hidden="true">{flagEmoji(r.iso3)}</span>}
                        {r.site === "" ? <Link to="/" className="text-electric-soft underline">{r.name}</Link>
                          : r.site ? <Link to="/$country" params={{ country: r.site }} className="text-electric-soft underline">{r.name}</Link>
                          : r.name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(r.tonnes)}</td>
                      <td className="px-3 py-2 text-night-muted">{goldPeriodLabel(r.period)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-night-muted">Only countries that file monthly with the IMF reserves template appear. Countries that don't file are left out, not estimated. Highlighted rows have their own UKStats page.</p>
            {t.flagged.length > 0 && (
              <section className="mt-6 rounded-md border border-night-line p-4 text-sm">
                <h2 className="font-semibold">Filed, but not ranked</h2>
                <p className="mt-1 text-night-muted">These filings are larger than any gold holding ever declared and look like a unit error in the submission. We show them exactly as filed and leave them out of the ranking rather than correct them ourselves.</p>
                <ul className="mt-2 space-y-1">{t.flagged.map((r) => <li key={r.iso3}>{flagEmoji(r.iso3) && <span className="mr-2" aria-hidden="true">{flagEmoji(r.iso3)}</span>}{r.name}: {r.ounces.toLocaleString("en-GB")} troy ounces as filed ({goldPeriodLabel(r.period)})</li>)}</ul>
              </section>
            )}
          </>
        )}
        <p className="mt-6 text-xs text-night-muted">
          Also see the <a href="https://www.gold.org/goldhub/data/gold-reserves-by-country" target="_blank" rel="noreferrer" className="underline">World Gold Council ranking</a> (an industry body, not a government source). Data as JSON or CSV: <a href="/api/public/v1/gold" className="underline">/api/public/v1/gold</a>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
