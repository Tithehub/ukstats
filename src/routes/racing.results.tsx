import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { ExampleBadge, NoFeed, RacingLayout } from "@/components/racing/RacingLayout";
import post from "@/assets/racing/finishing-post.jpg";
import { RACING_DEMO } from "@/lib/racing/providers/types";

import { resultsQuery } from "@/lib/racing/racing.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/racing/results")({
  loader: ({ context }) => context.queryClient.ensureQueryData(resultsQuery()),
  head: () => ({
    meta: [
      { title: "UK horse racing results — last 7 days | UKStats" },
      { name: "description", content: "Official UK horse racing results from the last seven days, with finishing positions and starting prices from licensed data." },
      { property: "og:title", content: "Racing results — UKStats" },
      { property: "og:description", content: "Official UK racing results from the last seven days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function Page() {
  const { data } = useSuspenseQuery(resultsQuery());
  const byRace = new Map<string, typeof data.rows>();
  for (const r of data.rows) byRace.set(r.race_id, [...(byRace.get(r.race_id) ?? []), r]);
  const races = [...byRace.values()].sort((a, b) => (b[0]!.race?.off_time ?? "").localeCompare(a[0]!.race?.off_time ?? ""));
  return <RacingLayout image={post} title="Race results" intro={RACING_DEMO ? "Example placings from the last 7 days. No starting prices are shown." : "Official results only. Starting prices are shown for the record, not as tips."}>
    {!races.length ? <NoFeed sources={[]} what="results" /> : <div className="grid gap-4 md:grid-cols-2">{races.map((rows) => {
      const r = rows[0]!.race; const top = [...rows].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).slice(0, 4);
      return <article key={rows[0]!.race_id} className="rounded-lg border border-night-line bg-night-panel p-4">
        <h2 className="font-semibold">{r?.name}</h2>
        <p className="text-xs text-night-muted">{r?.meeting?.course?.name} · {r ? fmtDate(r.off_time) : ""}</p>
        <ol className="mt-2 space-y-1 text-sm">{top.map((x) => <li key={x.horse?.id} className="flex justify-between gap-2"><span><span className="mr-2 font-mono text-racing-gold">{x.position ?? x.status}</span>{x.horse && <Link to="/racing/horses/$id" params={{ id: x.horse.id }} className="hover:underline">{x.horse.name}</Link>}{RACING_DEMO && <ExampleBadge />}</span><span className="font-mono text-night-muted">{x.starting_price_decimal != null ? `SP ${x.starting_price_decimal.toFixed(2)}` : ""}</span></li>)}</ol>
      </article>;
    })}</div>}
  </RacingLayout>;
}
