import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GlobeExplorer, type GlobeState } from "@/components/globe/GlobeExplorer";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { WORLD_INDICATORS } from "@/lib/world";


type Search = GlobeState;

export const Route = createFileRoute("/globe")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ind: WORLD_INDICATORS.some((i) => i.slug === s["ind"]) ? String(s["ind"]) : "none",
    official: s["official"] !== false && s["official"] !== "false",
    acled: s["acled"] !== false && s["acled"] !== "false",
    c: typeof s["c"] === "string" ? s["c"].slice(0, 80) : "",
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(worldQuery()), context.queryClient.ensureQueryData(unrestQuery())]),
  head: () => ({ meta: [
    { title: "World globe — official unrest warnings & country stats | UKStats" },
    { name: "description", content: "Spin a 3D globe of official government unrest warnings from the UK Foreign Office and US State Department, with World Bank country rankings and source links." },
    { property: "og:title", content: "World globe — official unrest warnings and country stats" },
    { property: "og:description", content: "Interactive 3D globe: government travel warnings mentioning protests or unrest, plus World Bank rankings, every item dated and sourced." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: "https://ukstats.co.uk/globe" }] }),
  component: GlobePage,
});

function GlobePage() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  return <div className="flex min-h-dvh flex-col bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" className="relative flex flex-1 flex-col">
      <GlobeExplorer state={s} onChange={(p) => void navigate({ search: { ...s, ...p }, replace: true })} />
    </main>
  </div>;
}
