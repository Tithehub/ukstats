import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, FileText, Search, Rss } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getDailyArchive } from "@/lib/daily.functions";
import { briefingSummary, longDate } from "@/lib/daily";
import { btn, btnToggle } from "@/lib/ui";

const DESC =
  "A written statement for every day, built only from the figures UK official bodies published that day, with the pinned headline numbers and links to each original release.";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily statement — the UK's numbers, day by day" },
      { name: "description", content: DESC },
      { property: "og:title", content: "UKStats daily statement archive" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/daily" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/daily" }],
  }),
  loader: () => getDailyArchive(),
  errorComponent: () => <Shell><p className="text-night-muted">The daily archive could not be loaded. Please try again.</p></Shell>,
  notFoundComponent: () => <Shell><p className="text-night-muted">Nothing here yet.</p></Shell>,
  component: DailyArchivePage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">{children}</main>
      <SiteFooter />
    </div>
  );
}

function DailyArchivePage() {
  const { latest, entries } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [month, setMonth] = useState<string>("all");

  const months = useMemo(() => {
    const set = new Map<string, string>();
    for (const e of entries) {
      const key = e.date.slice(0, 7);
      if (!set.has(key)) {
        const [y, m] = key.split("-").map(Number);
        set.set(
          key,
          new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        );
      }
    }
    return Array.from(set.entries());
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (month !== "all" && !e.date.startsWith(month)) return false;
      if (!needle) return true;
      return (
        e.headline.toLowerCase().includes(needle) ||
        e.body.toLowerCase().includes(needle) ||
        e.figures.some((f) => `${f.title} ${f.value} ${f.source}`.toLowerCase().includes(needle))
      );
    });
  }, [entries, q, month]);

  return (
    <Shell>
      <header className="border-b border-night-line/60 pb-6">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-electric">
          <FileText className="size-3.5" aria-hidden="true" />
          Public history
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Daily statement</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted">
          Each day the register writes down what was published, in words. Every sentence is built from the figures
          themselves — the value, its reference period and the body that issued it. Nothing is estimated, modelled or
          projected, and no day is written before it happens.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href="/feed.xml" className={btn("secondary", "sm")}>
            <Rss className="size-4" aria-hidden="true" />
            Feed
          </a>
          <ShareRow path="/daily" title="UKStats daily statement — the UK's numbers, day by day" />
        </div>
      </header>

      {latest ? (
        <section className="mt-8 rounded-2xl border border-night-line/60 bg-night-panel/40 p-5 sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Latest</p>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">{latest.headline}</h2>
          <div className="mt-4 space-y-3 whitespace-pre-line text-[15px] leading-relaxed text-night-fg/90">
            {latest.body}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/daily/$date" params={{ date: latest.date }} className={btn("primary", "sm")}>
              Open {longDate(latest.date)}
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-night-line/60 bg-night-panel/40 p-6">
          <h2 className="text-lg font-semibold">No statement recorded yet</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-night-muted">
            The record starts with the first scheduled sweep. Earlier days are deliberately left blank rather than
            written after the fact.
          </p>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-4 text-electric-soft" aria-hidden="true" />
            Archive
            <span className="font-mono text-[11px] text-night-muted">{filtered.length} days</span>
          </h2>
          <label className="relative flex min-w-[220px] flex-1 items-center sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 size-4 text-night-muted" aria-hidden="true" />
            <span className="sr-only">Search the daily statements</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search figures or wording"
              className="min-h-11 w-full rounded-md border border-night-line/70 bg-night-panel/50 pl-9 pr-3 text-[13px] text-night-fg placeholder:text-night-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
            />
          </label>
        </div>

        {months.length > 1 ? (
          <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <button type="button" onClick={() => setMonth("all")} className={btnToggle(month === "all", "sm")}>
              All
            </button>
            {months.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMonth(key)}
                className={btnToggle(month === key, "sm", "whitespace-nowrap")}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <ul className="mt-4 grid gap-2">
          {filtered.map((e) => (
            <li key={e.date}>
              <Link
                to="/daily/$date"
                params={{ date: e.date }}
                className="block rounded-xl border border-night-line/60 bg-night-panel/30 p-4 transition-colors hover:border-electric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft">
                    {longDate(e.date)}
                  </p>
                  <p className="font-mono text-[11px] text-night-muted">
                    {e.changeCount} published {e.changeCount === 1 ? "figure" : "figures"}
                  </p>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-night-fg/90">{briefingSummary(e)}</p>
              </Link>
            </li>
          ))}
          {!filtered.length && entries.length ? (
            <li className="rounded-xl border border-night-line/60 p-4 text-[14px] text-night-muted">
              No statement matches that search.
            </li>
          ) : null}
        </ul>
      </section>
    </Shell>
  );
}
