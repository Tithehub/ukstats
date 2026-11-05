import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SourceCard, FoiGuide } from "@/components/spending/SpendingBits";
import { EXPENDITURE_CATEGORIES, FOI_LINKS, SPENDING_SOURCES } from "@/lib/spending.data";
import { searchCouncils } from "@/lib/spending";

const T = "UK public spending by area and type — councils and government";
const D =
  "Where UK public money goes: government spending by function, spending per nation and region, and every council's spending by service, with direct links to the official sources and Freedom of Information pages.";

export const Route = createFileRoute("/spending/")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/spending" }],
  }),
  component: SpendingHub,
});

function SpendingHub() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/spending/" });
  const results = searchCouncils(q);
  const gov = EXPENDITURE_CATEGORIES.filter((c) => c.level === "government");
  const council = EXPENDITURE_CATEGORIES.filter((c) => c.level === "council");
  const ukSources = SPENDING_SOURCES.filter((s) => s.nation === "UK");
  const localSources = SPENDING_SOURCES.filter((s) => s.nation !== "UK");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Going deeper</p>
          <h1 className="mt-1 text-3xl font-bold">Public spending: councils and government</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Every link below goes to the official publisher. Spending is published per council, not per town — search a
            town and you'll land on the council that covers it.
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold">Find a council</h2>
          <input
            value={q}
            onChange={(e) => navigate({ search: { q: e.target.value }, replace: true })}
            placeholder="Town, city or council"
            className="mt-2 w-full max-w-md rounded-md border border-input bg-background px-3 py-2"
            aria-label="Search councils"
          />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <li key={c.slug}>
                <Link to="/spending/$council" params={{ council: c.slug }} className="block rounded-md border border-border bg-card p-3 hover:border-primary">
                  <span className="font-medium">{c.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{c.region} · {c.nation}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Not listed yet? <a className="underline" href={FOI_LINKS.findCouncil} target="_blank" rel="noopener noreferrer">Find any UK council on GOV.UK</a> — all
            councils' figures are in the national returns below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Government spending by type</h2>
          <CategoryGrid items={gov} />
        </section>

        <section>
          <h2 className="text-xl font-semibold">Council spending by type</h2>
          <CategoryGrid items={council} />
        </section>

        <section>
          <h2 className="text-xl font-semibold">UK-wide official sources</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{ukSources.map((s) => <SourceCard key={s.id} id={s.id} />)}</div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Council returns by nation</h2>
          <p className="text-sm text-muted-foreground">Each nation uses its own categories, so they are shown separately and never added together.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{localSources.map((s) => <SourceCard key={s.id} id={s.id} />)}</div>
        </section>

        <FoiGuide />
      </main>
      <SiteFooter />
    </div>
  );
}

function CategoryGrid({ items }: { items: typeof EXPENDITURE_CATEGORIES }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => (
        <li key={c.slug}>
          <Link to="/spending/type/$category" params={{ category: c.slug }} className="block h-full rounded-md border border-border bg-card p-3 hover:border-primary">
            <span className="font-medium">{c.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{c.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
