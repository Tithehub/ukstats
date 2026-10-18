import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, GitCompareArrows, Globe2, ShieldCheck, Table2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { SITES } from "@/lib/site-host";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";

/** World-first welcome shown on stats.solutions. Same figures, same rules. */
export function GlobalHome() {
  const europe = COUNTRIES.filter((c) => c.wave === 1);
  const national = COUNTRIES.filter((c) => c.wave === 2);
  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <section className="pt-12 sm:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric-soft">{SITES.global.name}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{SITES.global.tagline}</h1>
          <p className="mt-4 max-w-2xl text-night-muted">
            Inflation, unemployment, debt, house prices, population and more for {COUNTRIES.length + 1} countries, straight from each official publisher. Every figure shows its source, its age and the next release. Nothing is estimated.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link to="/countries"><Globe2 /> Explore countries</Link></Button>
            <Button asChild variant="outline"><Link to="/compare-countries" search={{ metric: "hicp" }}><GitCompareArrows /> Compare countries</Link></Button>
            <Button asChild variant="ghost"><Link to="/safest-places" search={{ country: "us" }}><ShieldCheck /> Safest places</Link></Button>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">United Kingdom</h2>
          <a href={`${SITES.uk.origin}/`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-night-line bg-night-panel px-4 py-2 hover:text-electric-soft">
            <Table2 className="size-4" aria-hidden /> UK figures on ukstats.co.uk <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Europe — live from Eurostat</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {europe.map((c) => (
              <li key={c.code}><Link to="/$country" params={{ country: c.code }} className="flex min-h-11 items-center rounded-md border border-night-line bg-night-panel px-3 py-2 hover:text-electric-soft">{c.name}</Link></li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">North America and Australia — national sources</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {national.map((c) => (
              <li key={c.code}><Link to="/$country" params={{ country: c.code }} className="flex min-h-11 items-center rounded-md border border-night-line bg-night-panel px-3 py-2 hover:text-electric-soft">{c.name}</Link></li>
            ))}
          </ul>
        </section>

        <nav aria-label="More world pages" className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link to="/gold" className="inline-flex items-center gap-1.5 text-electric-soft underline"><Banknote className="size-4" aria-hidden /> Gold reserves</Link>
          <Link to="/global" className="text-electric-soft underline">Every country's statistics office</Link>
          <Link to="/sources" className="text-electric-soft underline">Official sources</Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
