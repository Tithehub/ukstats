import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ExternalLink } from "lucide-react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/calendar")({
  loader: () => getUkStats(),
  head: () => ({
    meta: [
      { title: "Release calendar — UKStats" },
      {
        name: "description",
        content:
          "When each official UK statistic on UKStats is next due to be published, as announced by the issuing body.",
      },
      { property: "og:title", content: "Release calendar — UKStats" },
      {
        property: "og:description",
        content: "When each official UK statistic is next due, as announced by the issuing body.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/calendar" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/calendar" }],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { metrics } = Route.useLoaderData();
  const due = metrics
    .filter((m) => m.nextDue)
    .map((m) => ({ ...m, due: new Date(m.nextDue!) }))
    .filter((m) => !Number.isNaN(m.due.getTime()))
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const byMonth = new Map<string, typeof due>();
  for (const m of due) {
    const key = m.due.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" });
    const list = byMonth.get(key) ?? [];
    list.push(m);
    byMonth.set(key, list);
  }

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-electric" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Release calendar</h1>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted text-pretty">
          Every date below is the next release its issuing body has announced — not an estimate. When a body publishes
          a new figure, the register picks it up in the next daily sweep and the date rolls forward.
        </p>

        {byMonth.size === 0 ? (
          <p className="mt-8 rounded-xl border border-night-line bg-night-panel p-6 text-[14px] text-night-muted">
            No announced release dates are available right now.
          </p>
        ) : (
          [...byMonth.entries()].map(([month, list]) => (
            <section key={month} className="mt-8">
              <h2 className="font-mono text-[12px] uppercase tracking-wider text-night-muted">{month}</h2>
              <div className="mt-3 space-y-2">
                {list.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-night-line bg-night-panel px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-snug">{m.title}</p>
                      <p className="font-mono text-[11px] text-night-muted">
                        {m.category} · {m.cadence}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-mono text-[13px] text-electric">
                        {m.due.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Europe/London",
                        })}
                      </p>
                      <a
                        href={m.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-night-muted hover:text-electric"
                      >
                        {m.source}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        <p className="mt-8 font-mono text-[11px] text-night-muted">
          <Link to="/register" className="text-electric hover:underline">
            Full register
          </Link>{" "}
          · <Link to="/status" className="text-electric hover:underline">Feed health</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
