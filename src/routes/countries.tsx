import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTRIES } from "@/lib/countries";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Banner } from "@/components/Banner";
import img from "@/assets/compare-europe.jpg";

const T = "Official statistics for Europe and the Western world | UK Stats";
const D = "Inflation, unemployment, debt, house prices, asylum and population for 30 European countries from Eurostat, plus the US, Canada and Australia from their own national publishers — with source and data age on every figure.";

export const Route = createFileRoute("/countries")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: CountriesPage,
});

function CountriesPage() {
  const live = COUNTRIES.filter((c) => c.wave === 1);
  const next = COUNTRIES.filter((c) => c.wave === 2);
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Banner src={img} alt="Aerial view of rivers, roads and towns at dusk" eager />
        <h1 className="text-4xl font-semibold tracking-tight">Countries</h1>
        <p className="mt-2 max-w-2xl text-night-muted">{D}</p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link to="/" className="rounded-md border border-night-line px-3 py-1.5">United Kingdom (full register)</Link>
          <Link to="/compare-countries" search={{ metric: "hicp" }} className="rounded-md border border-night-line px-3 py-1.5">Compare countries</Link>
          <Link to="/online-speech" className="rounded-md border border-night-line px-3 py-1.5">Online speech convictions</Link>
        </div>
        <h2 className="mt-10 text-lg font-semibold">Europe — live from Eurostat</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {live.map((c) => (
            <li key={c.code}><Link to="/$country" params={{ country: c.code }} className="block rounded-md border border-night-line bg-night-panel px-3 py-2 hover:text-electric-soft">{c.name}</Link></li>
          ))}
        </ul>
        <h2 className="mt-10 text-lg font-semibold">North America and Australia — national sources</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {next.map((c) => (
            <li key={c.code}><Link to="/$country" params={{ country: c.code }} className="block rounded-md border border-night-line px-3 py-2 hover:text-electric-soft">{c.name}</Link></li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
