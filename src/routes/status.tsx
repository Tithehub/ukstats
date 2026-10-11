import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { getFeedStatus } from "@/lib/status.functions";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/status")({
  loader: () => getFeedStatus(),
  head: () => ({
    meta: [
      { title: "Feed health — UKStats" },
      {
        name: "description",
        content:
          "Live status of every official data feed behind UKStats: when each source was last checked and how reliably it has answered over the last 30 days.",
      },
      { property: "og:title", content: "Feed health — UKStats" },
      {
        property: "og:description",
        content: "Live status and 30-day reliability for every official data feed behind UKStats.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/status" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/status" }],
  }),
  component: StatusPage,
});

function statusIcon(status: string) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-fresh" aria-hidden />;
  if (status === "no-feed") return <AlertTriangle className="h-4 w-4 text-ageing" aria-hidden />;
  return <XCircle className="h-4 w-4 text-overdue" aria-hidden />;
}

function statusLabel(status: string) {
  if (status === "ok") return "Live";
  if (status === "no-feed") return "No live feed";
  return "Unreachable";
}

function StatusPage() {
  const { rows, fetchedAt } = Route.useLoaderData();
  const live = rows.filter((r) => r.status === "ok").length;
  const noFeed = rows.filter((r) => r.status === "no-feed").length;
  const down = rows.length - live - noFeed;

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-electric" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Feed health</h1>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted text-pretty">
          Every figure on UKStats comes from an official publisher's feed. This page shows, for each one, when it was
          last checked and how often it has answered over the last 30 days. When a publisher has no machine-readable
          feed, that is stated plainly rather than filled in.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-night-line bg-night-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">Live feeds</p>
            <p className="mt-1 text-2xl font-semibold text-fresh">{live}</p>
          </div>
          <div className="rounded-xl border border-night-line bg-night-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">No live feed</p>
            <p className="mt-1 text-2xl font-semibold text-ageing">{noFeed}</p>
          </div>
          <div className="rounded-xl border border-night-line bg-night-panel p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">Unreachable</p>
            <p className="mt-1 text-2xl font-semibold text-overdue">{down}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-night-line bg-night-panel p-6 text-[14px] text-night-muted">
            No checks recorded yet. The daily sweep logs its first set of results the next time it runs.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-night-line">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-night-line bg-night-panel font-mono text-[11px] uppercase tracking-wider text-night-muted">
                  <th className="px-4 py-3 font-medium">Figure</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last checked</th>
                  <th className="px-4 py-3 font-medium">30-day reliability</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.metricId} className="border-b border-night-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.title}</p>
                      <p className="font-mono text-[11px] text-night-muted">{r.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-electric hover:underline"
                      >
                        {r.source}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {statusIcon(r.status)}
                        {statusLabel(r.status)}
                      </span>
                      {r.note && r.status !== "ok" && (
                        <p className="mt-0.5 max-w-[220px] font-mono text-[10px] text-night-muted">{r.note}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-night-muted">
                      {new Date(r.lastChecked).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]">
                      {r.total30 > 0 ? `${Math.round((r.ok30 / r.total30) * 100)}% (${r.ok30}/${r.total30})` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 font-mono text-[11px] text-night-muted">
          Checked by the daily sweep · page generated {new Date(fetchedAt).toLocaleString("en-GB")} ·{" "}
          <Link to="/register" className="text-electric hover:underline">
            Full register
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
