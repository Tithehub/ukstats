import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { RacingLayout, Stat } from "@/components/racing/RacingLayout";
import { personQuery, type PersonKind } from "@/lib/racing/racing.functions";
import { winRate } from "@/lib/racing/racing";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/racing/people/$kind/$id")({
  params: { parse: (p) => ({ kind: (p.kind === "jockey" ? "jockey" : "trainer") as PersonKind, id: p.id }), stringify: (p) => p },
  loader: async ({ context, params }) => { const d = await context.queryClient.ensureQueryData(personQuery(params.kind, params.id)); if (!d) throw notFound(); return { name: d.person.name, kind: params.kind }; },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.name} — ${loaderData.kind} record | UKStats racing` },
      { name: "description", content: `${loaderData.name}'s runs, wins and strike rate by course, each with its sample size.` },
      { property: "og:title", content: `${loaderData.name} — UKStats racing` },
      { property: "og:description", content: `${loaderData.kind === "jockey" ? "Jockey" : "Trainer"} record from licensed racing data.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ] : [{ title: "Profile unavailable | UKStats" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function Page() {
  const { kind, id } = Route.useParams();
  const { data } = useSuspenseQuery(personQuery(kind, id));
  if (!data) return null;
  const done = data.rows.filter((r) => r.position != null);
  const wins = done.filter((r) => r.position === 1).length;
  const since = Date.now() - 14 * 86_400_000;
  const recent = done.filter((r) => new Date(r.off_time).getTime() >= since);
  const byCourse = new Map<string, { runs: number; wins: number }>();
  for (const r of done) { const v = byCourse.get(r.course) ?? { runs: 0, wins: 0 }; v.runs++; if (r.position === 1) v.wins++; byCourse.set(r.course, v); }
  return <RacingLayout title={data.person.name} intro={kind === "jockey" ? "Jockey" : "Trainer"}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Runs with a result" value={done.length} />
      <Stat label="Wins" value={wins} note={winRate(wins, done.length).label} />
      <Stat label="Last 14 days" value={recent.filter((r) => r.position === 1).length} note={winRate(recent.filter((r) => r.position === 1).length, recent.length).label} />
      <Stat label="Upcoming rides / runners" value={data.rows.filter((r) => r.position == null && new Date(r.off_time).getTime() > Date.now()).length} />
    </div>
    <p className="mt-2 text-xs text-night-muted">UKStats calculations from the results we hold, not official figures.</p>
    <section className="mt-6 rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="font-semibold">By course</h2>
      {byCourse.size ? <ul className="mt-2 space-y-1 text-sm">{[...byCourse].sort((a, b) => b[1].runs - a[1].runs).map(([c, v]) => <li key={c} className="flex justify-between gap-2"><span>{c}</span><span className="font-mono text-night-muted">{winRate(v.wins, v.runs).label}</span></li>)}</ul> : <p className="mt-2 text-sm text-night-muted">No results recorded.</p>}
    </section>
    <section className="mt-6">
      <h2 className="text-xl font-bold">Recent runs</h2>
      <ul className="mt-3 divide-y divide-night-line rounded-lg border border-night-line bg-night-panel">{data.rows.slice(0, 40).map((r, i) => <li key={i} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm">
        <span>{fmtDate(r.off_time)} · {r.course} · <Link to="/racing/horses/$id" params={{ id: r.horse_id }} className="font-semibold hover:underline">{r.horse}</Link></span>
        <span className="font-mono">{r.position ?? "—"}</span></li>)}</ul>
    </section>
  </RacingLayout>;
}
