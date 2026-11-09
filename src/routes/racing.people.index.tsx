import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { NoFeed, RacingLayout } from "@/components/racing/RacingLayout";
import { peopleQuery } from "@/lib/racing/racing.functions";

export const Route = createFileRoute("/racing/people/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 60) : undefined }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(peopleQuery(deps.q)),
  head: () => ({
    meta: [
      { title: "Trainers and jockeys — records and strike rates | UKStats" },
      { name: "description", content: "UK racehorse trainer and jockey records by course, with every strike rate shown alongside the number of runs it is based on." },
      { property: "og:title", content: "Trainers and jockeys — UKStats racing" },
      { property: "og:description", content: "Trainer and jockey records with sample sizes, from licensed racing data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function Page() {
  const { q } = Route.useSearch();
  const nav = useNavigate({ from: "/racing/people/" });
  const { data } = useSuspenseQuery(peopleQuery(q ?? ""));
  const empty = !data.trainers.length && !data.jockeys.length;
  return <RacingLayout demo={data.demo} title="Trainers & jockeys" intro="Every percentage shows how many runs it's based on.">
    <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("q"); nav({ search: { q: typeof v === "string" && v ? v : undefined } }); }} className="flex gap-2">
      <input name="q" defaultValue={q ?? ""} placeholder="Search trainers and jockeys" aria-label="Search trainers and jockeys" className="min-h-11 flex-1 rounded-md border border-night-line bg-night-panel px-3 text-night-fg" />
      <button className="min-h-11 rounded-md bg-racing-gold px-4 font-semibold text-night">Search</button>
    </form>
    <div className="mt-6">{empty ? (q ? <p className="text-night-muted">Nobody matches "{q}".</p> : <NoFeed sources={[]} what="trainers or jockeys" />) :
      <div className="grid gap-4 md:grid-cols-2">{([["Trainers", "trainer", data.trainers], ["Jockeys", "jockey", data.jockeys]] as const).map(([t, kind, rows]) => <section key={t} className="rounded-lg border border-night-line bg-night-panel p-4">
        <h2 className="font-semibold">{t}</h2>
        <ul className="mt-2">{rows.map((p) => <li key={p.id}><Link to="/racing/people/$kind/$id" params={{ kind, id: p.id }} className="flex min-h-11 items-center hover:underline">{p.name}</Link></li>)}</ul>
      </section>)}</div>}
    </div>
  </RacingLayout>;
}
