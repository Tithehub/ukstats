import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GLOBAL_OFFICES, GLOBAL_REGIONS } from "@/lib/global.data";
import { ShareRow } from "@/components/ShareRow";

const T = "Every country's official statistics office | UK Stats";
const D = "The national statistics office for 164 countries beyond the 33 with full UKStats pages — grouped by region, from the UN Statistics Division directory, with each link checked.";

export const Route = createFileRoute("/global")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stats.solutions/global" },
      { property: "og:image", content: "https://ukstats.co.uk/og/sources.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ukstats.co.uk/og/sources.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://stats.solutions/global" }],
  }),
  component: GlobalPage,
});

function GlobalPage() {
  const checked = GLOBAL_OFFICES.filter((o) => o.ok).length;
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">The rest of the world</h1>
        <p className="mt-2 max-w-2xl text-night-muted">
          {D} These countries are not tracked figure-by-figure on UKStats yet — this is the official publisher to go to for each one.
        </p>
        <p className="mt-3 text-sm">
          Directory source: <a href="https://unstats.un.org/home/nso_sites/" target="_blank" rel="noreferrer" className="text-electric-soft underline">UN Statistics Division</a>. {checked} of {GLOBAL_OFFICES.length} office sites answered an automated check on 12 October 2026; the rest are marked &ldquo;not answering&rdquo; — many government sites block automated requests, so the link may still open fine in a browser.
        </p>
        <p className="mt-2 text-sm">
          The 33 countries with full live pages are on <Link to="/countries" className="text-electric-soft underline">Countries</Link>, and their agencies on <Link to="/sources" className="text-electric-soft underline">Official sources</Link>.
        </p>
        <ShareRow className="mt-4" path="/global" title="Every country's official statistics office" sourceUrl="https://unstats.un.org/home/nso_sites/" sourceLabel="UN directory" />
        {GLOBAL_REGIONS.map((region) => {
          const offices = GLOBAL_OFFICES.filter((o) => o.region === region);
          return (
            <section key={region} className="mt-10">
              <h2 className="text-lg font-semibold">{region} <span className="ml-2 font-mono text-xs text-night-muted">{offices.length}</span></h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {offices.map((o) => (
                  <li key={o.country} className="rounded-md border border-night-line bg-night-panel px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{o.country}</span>
                      {!o.ok && <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ageing">not answering</span>}
                    </div>
                    <a href={o.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-sm text-electric-soft hover:underline" title={o.url}>
                      {o.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </div>
  );
}
