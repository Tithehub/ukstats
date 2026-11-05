import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SourceCard, FoiGuide } from "@/components/spending/SpendingBits";
import { EXPENDITURE_CATEGORIES } from "@/lib/spending.data";
import { categorySourcesFor, councilBySlug, councilSources } from "@/lib/spending";

export const Route = createFileRoute("/spending/$council")({
  loader: ({ params }) => {
    const c = councilBySlug(params.council);
    if (!c) throw notFound();
    return { slug: c.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? councilBySlug(loaderData.slug) : undefined;
    const t = c ? `${c.name} spending — official sources and FOI` : "Council spending — unavailable";
    const d = c
      ? `Where ${c.name} spends its money, by service, with links to the official ${c.nation} returns, the council's accounts and its Freedom of Information requests.`
      : "Council not found.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(c ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: CouncilPage,
  notFoundComponent: () => (
    <div className="p-8">Council not found. <Link className="underline" to="/spending">Back to spending</Link></div>
  ),
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error instanceof Error ? error.message : String(error)}</div>,
});

function CouncilPage() {
  const { slug } = Route.useLoaderData();
  const c = councilBySlug(slug)!;
  const cats = EXPENDITURE_CATEGORIES.filter((k) => k.level === "council");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header>
          <Link to="/spending" className="font-mono text-xs uppercase text-muted-foreground underline">Public spending</Link>
          <h1 className="mt-1 text-3xl font-bold">{c.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{c.region} · {c.nation} · covers {c.places.join(", ")}</p>
        </header>

        <section className="flex flex-wrap gap-3">
          <a className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href={c.website} target="_blank" rel="noopener noreferrer">
            Council website (budgets, accounts{c.nation === "England" ? ", payments over £500" : ""})
          </a>
          <a className="rounded-md border border-border px-4 py-2" href={c.whatDoTheyKnow} target="_blank" rel="noopener noreferrer">
            FOI requests to this council
          </a>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Spending by service</h2>
          <p className="text-sm text-muted-foreground">
            Each service links to the official {c.nation} return that holds this council's figure. Where no return covers a
            service in {c.nation}, it says "Not published".
          </p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {cats.map((k) => {
              const ids = categorySourcesFor(k.slug, c);
              return (
                <li key={k.slug} className="rounded-md border border-border bg-card p-3">
                  <Link to="/spending/type/$category" params={{ category: k.slug }} className="font-medium underline">{k.label}</Link>
                  <p className="text-xs text-muted-foreground">{k.description}</p>
                  <p className="mt-1 font-mono text-xs">
                    {ids.length ? `In: ${ids.length} official ${ids.length === 1 ? "return" : "returns"} below` : "Not published for " + c.nation}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Official sources for this council</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{councilSources(c.nation).map((id) => <SourceCard key={id} id={id} />)}</div>
        </section>

        <FoiGuide councilFoi={c.whatDoTheyKnow} />
      </main>
      <SiteFooter />
    </div>
  );
}
