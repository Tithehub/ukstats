import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { COUNTRIES } from "@/lib/countries";
import { agencyGroups, categoryLabel } from "@/lib/agencies";
import { CATEGORIES } from "@/lib/uk-stats";

const T = "Official statistics sources for 33 countries | UK Stats";
const D = "Who publishes the official figure for crime, prices, migration, weather, defence, health and elections in each country — a directory of government bodies with checked links.";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: "https://stats.solutions/sources" }, { property: "og:image", content: "https://ukstats.co.uk/og/sources.jpg" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: "https://ukstats.co.uk/og/sources.jpg" }],
    links: [{ rel: "canonical", href: "https://stats.solutions/sources" }],
  }),
  component: SourcesPage,
});

function SourcesPage() {
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Official sources by country</h1>
        <p className="mt-2 max-w-2xl text-night-muted">{D} A dash means we have not verified an official publisher for that topic.</p>
        <div className="mt-8 overflow-x-auto rounded-md border border-night-line">
          <table className="text-xs">
            <thead className="bg-night-panel text-left font-mono uppercase tracking-wider text-night-muted">
              <tr><th className="sticky left-0 bg-night-panel px-3 py-2">Country</th>{CATEGORIES.map((c) => <th key={c} className="min-w-40 px-3 py-2">{categoryLabel(c)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-night-line">
              {COUNTRIES.map((c) => (
                <tr key={c.code} className="align-top">
                  <td className="sticky left-0 bg-night px-3 py-2 font-medium"><Link to="/$country/sources" params={{ country: c.code }} className="text-electric-soft underline">{c.name}</Link></td>
                  {agencyGroups(c.code).map((g) => (
                    <td key={g.category} className="px-3 py-2">
                      {g.bodies.length ? g.bodies.map((b) => <a key={b.url + b.name} href={b.url} target="_blank" rel="noreferrer" className="block hover:text-electric-soft">{b.name}</a>) : <span className="text-night-muted">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
