import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Check, Download, Globe2, Lock } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { canDownload, dailyEquivalent, gbp, REPORT_PRICES, reportPlanLabel, savingPercent, subActive, type ReportEdition, type ReportKind, type ReportPriceId } from "@/lib/reports";
import { createReportCheckout, createReportPortal, getMyReportAccess, getReportDownload, listReportEditions } from "@/lib/reports.functions";
import headlines from "@/assets/reports/uk-02.jpg";
import globalCover from "@/assets/reports/global-01.jpg";
import world from "@/assets/reports/global-12.jpg";

const editionsQuery = queryOptions({ queryKey: ["report-editions"], queryFn: () => listReportEditions(), staleTime: 60_000 });

export const Route = createFileRoute("/reports")({
  validateSearch: (s: Record<string, unknown>): { checkout?: "done" } => (s["checkout"] === "done" ? { checkout: "done" } : {}),
  loader: ({ context }) => context.queryClient.ensureQueryData(editionsQuery),
  head: () => ({ meta: [
    { title: "UK & Global Stats daily PDF report — from 75p" },
    { name: "description", content: "A professionally designed daily PDF of every official UK figure, with source, period, publication date and next release. Includes world rankings for every country. From 75p a day." },
    { property: "og:title", content: "Daily UKStats PDF reports" },
    { property: "og:description", content: "Every official figure, sourced and dated, in one branded PDF each morning. 75p a day, £2.49 a week, £9.99 a month or £99 a year." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://ukstats.co.uk/reports" },
    { name: "twitter:card", content: "summary" },
  ], links: [{ rel: "canonical", href: "https://ukstats.co.uk/reports" }] }),
  component: ReportsPage,
});

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
const kindLabel: Record<ReportKind, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function envOrNull() { try { return getStripeEnvironment(); } catch { return null; } }

function ReportsPage() {
  const { data: arch } = useSuspenseQuery(editionsQuery);
  const { signedIn, loading } = useAuth();
  const env = envOrNull();
  const qc = useQueryClient();
  const justPaid = Route.useSearch().checkout === "done";
  const access = useServerFn(getMyReportAccess);
  const mine = useQuery({ queryKey: ["my-reports", env], enabled: signedIn && !!env, queryFn: () => access({ data: { environment: env! } }), refetchInterval: (q) => (justPaid && q.state.dataUpdateCount < 10 ? 3_000 : false) });
  const checkoutFn = useServerFn(createReportCheckout), downloadFn = useServerFn(getReportDownload), portalFn = useServerFn(createReportPortal);
  const [buying, setBuying] = useState<{ priceId: ReportPriceId; date?: string | undefined } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const purchases = mine.data?.purchases ?? [], subs = mine.data?.subs ?? [];
  const activeSub = subs.find((s) => subActive(s, new Date()));
  const owns = (edition: ReportEdition, kind: ReportKind, date: string) => canDownload({ edition, kind, date }, purchases, subs);

  const buy = (priceId: ReportPriceId, date?: string) => {
    if (!signedIn) { window.location.href = "/auth?next=/reports"; return; }
    setBuying({ priceId, date });
    setTimeout(() => document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const fetchClientSecret = async () => {
    const r = await checkoutFn({ data: { priceId: buying!.priceId, date: buying!.date, environment: env!, returnUrl: `${window.location.origin}/reports?checkout=done` } });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };
  const download = async (edition: ReportEdition, kind: ReportKind, date: string) => {
    const key = `${edition}-${kind}-${date}`;
    setBusy(key);
    try {
      const r = await downloadFn({ data: { edition, kind, date, environment: env! } });
      if ("error" in r) { toast.error(r.error); return; }
      const bin = atob(r.base64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = r.fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      void qc.invalidateQueries({ queryKey: ["report-editions"] });
    } finally { setBusy(null); }
  };
  const manage = async () => {
    const w = window.open("", "_blank");
    const r = await portalFn({ data: { environment: env!, returnUrl: `${window.location.origin}/reports` } });
    if ("error" in r) { w?.close(); toast.error(r.error); return; }
    if (w) w.location.href = r.url; else window.location.href = r.url;
  };

  const today = arch.today;
  const dates = Array.from(new Set([today, ...arch.editions.filter((e) => e.kind === "daily").map((e) => e.report_date)])).sort().reverse().slice(0, 30);
  const periodic = arch.editions.filter((e) => e.kind !== "daily");
  const built = (edition: ReportEdition, date: string) => arch.editions.some((e) => e.edition === edition && e.kind === "daily" && e.report_date === date);

  const Action = ({ edition, kind, date }: { edition: ReportEdition; kind: ReportKind; date: string }) => {
    const key = `${edition}-${kind}-${date}`;
    if (signedIn && owns(edition, kind, date))
      return <Button size="sm" onClick={() => download(edition, kind, date)} disabled={busy === key}><Download className="size-4" aria-hidden />{busy === key ? "Preparing…" : "Download PDF"}</Button>;
    if (kind !== "daily") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" aria-hidden /> Subscribers</span>;
    const id: ReportPriceId = "report_combined_daily";
    return <Button size="sm" variant="outline" onClick={() => buy(id, date)} disabled={!env}>Buy {gbp(REPORT_PRICES[id].pence)}</Button>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">UKStats reports</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Every official figure, in one beautifully set PDF each morning</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">Built at 07:00 London time from the same figures on ukstats.co.uk. Each figure shows its source, period, publication date and next release, plus the year-on-year change when the publisher gives one. Missing figures say "Not published". Also includes UK Government warnings, links to emergency supply kits (we make no money from them) and the day's main headlines, labelled as news. It also covers every country's UK and US travel warnings and headlines by country. All the stats stay free on the site. The PDF is a paid, ready-to-share version.</p>
        {justPaid && <p className="mt-4 rounded-lg border border-primary bg-primary/5 p-3 text-sm font-semibold">Thank you — your purchase is confirmed. Your download button appears below within a few seconds.</p>}

        <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Sample pages">
          {[[globalCover, "Cover"], [headlines, "Headline figures"], [world, "World rankings"]].map(([src, cap]) => (
            <figure key={cap} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <img src={src} alt={`Sample report page: ${cap}`} className="aspect-[1/1.414] w-full object-cover object-top" loading="lazy" width={428} height={605} />
              <figcaption className="border-t border-border px-3 py-2 text-xs font-semibold">{cap}</figcaption>
            </figure>
          ))}
        </section>

        <section className="mt-10 rounded-xl border-2 border-primary/80 bg-card p-5" aria-label="Prices">
          <div className="flex items-center gap-2"><Globe2 className="size-5" aria-hidden /><h2 className="text-2xl font-black">UK & Global Stats</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">One report: every UK figure on the register (debt, small boats, inflation, crime, warnings and more), then world rankings and five main figures for every country.</p>
          <div className="mt-4 flex items-baseline gap-2"><span className="font-mono text-4xl font-black">{gbp(REPORT_PRICES.report_combined_daily.pence)}</span><span className="text-sm text-muted-foreground">per daily report</span></div>
          <Button className="mt-3 w-full sm:w-auto" size="lg" onClick={() => buy("report_combined_daily")} disabled={!env || (signedIn && owns("global", "daily", today))}>{signedIn && owns("global", "daily", today) ? "You own today's report" : "Buy today's report"}</Button>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {(["report_combined_weekly", "report_combined_monthly", "report_combined_yearly"] as const).map((id) => {
              const p = REPORT_PRICES[id];
              return (
                <div key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0"><p className="font-bold">{gbp(p.pence)} <span className="text-sm font-normal text-muted-foreground">/ {p.interval}</span></p>
                    <p className="text-xs text-muted-foreground"><s>{gbp(dailyEquivalent(id))}</s> bought daily · save {savingPercent(id)}%</p></div>
                  <Button className="min-h-11 shrink-0" size="sm" variant="secondary" onClick={() => buy(id)} disabled={!env || !!activeSub}>Subscribe</Button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Subscriptions include the daily, weekly and monthly editions.</p>
        </section>
        {!env && <p className="mt-3 text-sm text-muted-foreground">Checkout isn't switched on for this site yet.</p>}
        <ul className="mt-4 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
          {["Official figures only, nothing estimated", "Downloads are tied to your account, never a shareable link", "Cancel any time, access runs to the end of the period"].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{t}</li>)}
        </ul>

        {buying && env && (
          <section id="checkout" className="mt-8 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{REPORT_PRICES[buying.priceId].label}{buying.date ? ` — ${longDate(buying.date)}` : ""}</h2><button className="text-sm underline" onClick={() => setBuying(null)}>Cancel</button></div>
            <EmbeddedCheckoutProvider key={`${buying.priceId}-${buying.date ?? ""}`} stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
          </section>
        )}

        <section className="mt-10" aria-labelledby="mine">
          <h2 id="mine" className="text-2xl font-black">My reports</h2>
          {loading ? <p className="mt-2 text-sm text-muted-foreground">Checking your account…</p>
            : !signedIn ? <p className="mt-2 text-sm"><Link to="/auth" search={{ next: "/reports" }} className="font-semibold underline">Sign in</Link> to buy reports and download the ones you own.</p>
            : activeSub ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <p className="text-sm"><strong>{reportPlanLabel(activeSub.price_id)}</strong> — {activeSub.cancel_at_period_end || activeSub.status === "canceled" ? "ends" : "renews"} {activeSub.current_period_end ? longDate(activeSub.current_period_end.slice(0, 10)) : ""}. Every edition below is unlocked.</p>
                <Button variant="outline" size="sm" onClick={manage}>Manage subscription</Button>
              </div>)
            : <p className="mt-2 text-sm text-muted-foreground">{purchases.length ? `You own ${purchases.length} daily ${purchases.length === 1 ? "report" : "reports"}.` : "You haven't bought a report yet."}</p>}
        </section>

        <section className="mt-8" aria-labelledby="archive">
          <h2 id="archive" className="text-2xl font-black">Report archive</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="block w-full text-sm sm:table">
              <thead className="sr-only bg-primary text-primary-foreground sm:not-sr-only sm:table-header-group"><tr><th scope="col" className="px-3 py-2 text-left">Date</th><th scope="col" className="px-3 py-2 text-left">UK & Global Stats</th></tr></thead>
              <tbody className="block w-full sm:table-row-group">
                {dates.map((d) => (
                  <tr key={d} className="grid grid-cols-2 border-t border-border sm:table-row">
                    <th scope="row" className="col-span-2 px-3 py-3 text-left font-semibold sm:py-2">{longDate(d)}{d === today && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary-foreground">Today</span>}</th>
                    <td className="col-span-2 min-w-0 px-3 pb-3 sm:py-2">{d === today || built("global", d) ? <Action edition="global" kind="daily" date={d} /> : <span className="text-xs text-muted-foreground">Not built</span>}</td>
                  </tr>
                ))}
                {periodic.filter((e) => e.edition === "global").map((e) => (
                  <tr key={`${e.edition}-${e.kind}-${e.report_date}`} className="border-t border-border bg-muted/40">
                    <td className="px-3 py-2 font-semibold">{kindLabel[e.kind]} UK & Global Stats — {longDate(e.report_date)}</td>
                    <td className="px-3 py-2" ><Action edition={e.edition} kind={e.kind} date={e.report_date} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
