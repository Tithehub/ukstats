import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUkStats } from "@/lib/uk-stats.functions";
import { createSharedPage } from "@/lib/shared-pages.functions";
import { getOwnerToken } from "@/lib/owner-token";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { btn } from "@/lib/ui";

import { CATEGORIES, type StatsPayload } from "@/lib/uk-stats";

const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/create")({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  head: () => ({
    meta: [
      { title: "Create a live UK statistics page — National Data Register" },
      {
        name: "description",
        content:
          "Build a one-page, PDF-ready live UK statistics sheet you can share to socials and keep live from 24 hours up to a year.",
      },
      { property: "og:title", content: "Create a live UK statistics page" },
      {
        property: "og:description",
        content: "Pick your official UK figures, choose how long the page stays live, then share or download it as a PDF.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/create" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/create" }],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { data } = useSuspenseQuery(statsQuery);
  const navigate = useNavigate();
  const create = useServerFn(createSharedPage);

  const [title, setTitle] = useState("UK National Data Register — live sheet");
  const [selected, setSelected] = useState<string[]>(data.metrics.map((m) => m.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function submit() {
    setError(null);
    if (selected.length === 0) {
      setError("Pick at least one statistic.");
      return;
    }
    setBusy(true);
    try {
      const ownerToken = getOwnerToken();
      const page = await create({
        data: { title: title.trim() || "UK live statistics", metricIds: selected, ownerToken },
      });
      void navigate({ to: "/p/$slug", params: { slug: page.slug } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the page.");
      setBusy(false);
    }
  }


  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />


      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Create a live, shareable stats page</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-steel">
          Your page always re-reads the official sources when someone opens it — the figures are never frozen. Download it
          as a PDF at any time, post the link to socials, or keep it for yourself.
        </p>

        <section className="mt-8">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel/60" htmlFor="title">
            Page headline
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-lg bg-card/60 px-3 py-2.5 text-sm ring-1 ring-ink/10 outline-none focus:ring-brand"
          />
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel/60">
              Statistics · {selected.length} of {data.metrics.length} selected
            </p>
            <button
              onClick={() => setSelected(data.metrics.map((m) => m.id))}
              className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-[11px] text-steel hover:bg-ink/10"
            >
              Select all
            </button>
            <button
              onClick={() => setSelected([])}
              className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-[11px] text-steel hover:bg-ink/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 space-y-5">
            {CATEGORIES.map((cat) => {
              const items = data.metrics.filter((m) => m.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel/50">{cat}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => {
                      const on = selected.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggle(m.id)}
                          className={`rounded-lg px-3 py-2.5 text-left text-[13px] ring-1 transition-colors ${
                            on ? "bg-ink text-ground ring-ink" : "bg-card/50 text-ink ring-ink/10 hover:bg-card"
                          }`}
                        >
                          <span className="block font-medium leading-snug">{m.title}</span>
                          <span className={`mt-0.5 block font-mono text-[10px] ${on ? "text-ground/60" : "text-steel/60"}`}>
                            {m.value ?? "no live value"} · {m.source.split(" · ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric">Free, for as long as you need</p>
          <p className="mt-2 text-[13px] leading-relaxed text-night-muted text-pretty">
            There is no charge and no payment step. Your page stays live for a year and you can keep it live with one
            tap from <span className="text-night-fg">My pages</span> — sign in and it follows you to any device. If the
            site is useful, a voluntary crypto donation on the{" "}
            <Link to="/support" className="text-electric-soft underline underline-offset-2">
              support page
            </Link>{" "}
            keeps it running.
          </p>
        </section>

        {error ? <p className="mt-6 font-mono text-[12px] text-overdue">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-night-line/60 pt-6">
          <button onClick={() => void submit()} disabled={busy} className={btn("primary", "md")}>
            {busy ? "Creating…" : "Create my live page"}
          </button>
          <Link to="/my-pages" className={btn("secondary", "md")}>
            My pages
          </Link>
          <Link to="/" className="text-sm text-night-muted hover:underline">
            Back to the register
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

