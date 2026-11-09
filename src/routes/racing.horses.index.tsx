import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { NoFeed, RacingLayout } from "@/components/racing/RacingLayout";
import { horsesQuery } from "@/lib/racing/racing.functions";

export const Route = createFileRoute("/racing/horses/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 60) : undefined }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(horsesQuery(deps.q)),
  head: () => ({
    meta: [
      { title: "Horse database — career records and form | UKStats" },
      { name: "description", content: "Search UK racehorses by name for career records, last five runs and full race history from licensed racing data." },
      { property: "og:title", content: "Horse database — UKStats racing" },
      { property: "og:description", content: "Career records and form for UK racehorses, from licensed racing data." },
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
  const nav = useNavigate({ from: "/racing/horses/" });
  const { data } = useSuspenseQuery(horsesQuery(q ?? ""));
  return <RacingLayout demo={data.demo} title="Horse database" intro="Every horse is identified by its data provider's own ID, not just its name, so horses with the same name are never mixed up.">
    <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("q"); nav({ search: { q: typeof v === "string" && v ? v : undefined } }); }} className="flex gap-2">
      <input name="q" defaultValue={q ?? ""} placeholder="Search horses by name" aria-label="Search horses" className="min-h-11 flex-1 rounded-md border border-night-line bg-night-panel px-3 text-night-fg" />
      <button className="min-h-11 rounded-md bg-racing-gold px-4 font-semibold text-night">Search</button>
    </form>
    <div className="mt-6">
      {!data.rows.length ? (q ? <p className="text-night-muted">No horse matches "{q}".</p> : <NoFeed sources={[]} what="horses" />) :
        <ul className="divide-y divide-night-line rounded-lg border border-night-line bg-night-panel">{data.rows.map((h) => <li key={h.id}>
          <Link to="/racing/horses/$id" params={{ id: h.id }} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 hover:bg-night">
            <span className="font-semibold">{h.name}</span><span className="text-xs text-night-muted">{[h.sex, h.foaled?.slice(0, 4), h.trainer?.name].filter(Boolean).join(" · ")}</span>
          </Link></li>)}</ul>}
    </div>
  </RacingLayout>;
}
