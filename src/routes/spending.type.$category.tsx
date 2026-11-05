import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SourceCard, FoiGuide } from "@/components/spending/SpendingBits";
import { COUNCILS } from "@/lib/spending.data";
import { categoryBySlug, categorySourcesFor } from "@/lib/spending";

export const Route = createFileRoute("/spending/type/$category")({
  loader: ({ params }) => {
    if (!categoryBySlug(params.category)) throw notFound();
    return { slug: params.category };
  },
  head: ({ loaderData }) => {
    const k = loaderData ? categoryBySlug(loaderData.slug) : undefined;
    const t = k ? `${k.label} spending in the UK — official sources` : "Spending type — unavailable";
    const d = k ? `${k.description} Official UK sources for ${k.label.toLowerCase()} spending, by nation and council.` : "Not found.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(k ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="p-8">Spending type not found. <Link className="underline" to="/spending" search={{ q: "" }}>Back to spending</Link></div>
  ),
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error.message}</div>,
});

function CategoryPage() {
  const { slug } = Route.useLoaderData();
  const k = categoryBySlug(slug)!;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header>
          <Link to="/spending" search={{ q: "" }} className="font-mono text-xs uppercase text-muted-foreground underline">Public spending</Link>
          <h1 className="mt-1 text-3xl font-bold">{k.label}</h1>
          <p className="text-muted-foreground">{k.description}</p>
          <p className="font-mono text-xs text-muted-foreground">{k.level === "government" ? "Government spending (HM Treasury function)" : "Council spending (local returns)"}</p>
        </header>

        <section>
          <h2 className="text-xl font-semibold">Where the official figures are</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">{k.sourceIds.map((id) => <SourceCard key={id} id={id} />)}</div>
        </section>

        {k.level === "council" && (
          <section>
            <h2 className="text-xl font-semibold">By council</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {COUNCILS.map((c) => {
                const has = categorySourcesFor(k.slug, c).length > 0;
                return (
                  <li key={c.slug} className="rounded-md border border-border bg-card p-3">
                    <Link to="/spending/$council" params={{ council: c.slug }} className="font-medium underline">{c.name}</Link>
                    <span className="block font-mono text-xs text-muted-foreground">{has ? `In the ${c.nation} return` : `Not published for ${c.nation}`}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <FoiGuide />
      </main>
      <SiteFooter />
    </div>
  );
}
