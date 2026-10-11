import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const URL = "https://ukstats.co.uk/api-docs";
const TITLE = "Open data API — UKStats register in JSON and CSV";
const DESC = "Free, open JSON and CSV API for every figure on the UK National Data Register, with source, period, publication date and next release.";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ApiDocs,
});

const BASE = "https://ukstats.co.uk/api/public/v1/metrics";
const EXAMPLES = [
  { label: "Every figure (JSON)", url: BASE },
  { label: "Every figure (CSV)", url: `${BASE}?format=csv` },
  { label: "One category", url: `${BASE}?category=Finance` },
  { label: "One figure", url: `${BASE}?id=uk-cpi` },
];

function ApiDocs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Open data API</h1>
          <p className="text-muted-foreground">
            Every figure on the register, free to use, no key needed. Each record carries its official source, link, reference
            period, publication date and next scheduled release. Values are exactly as published — nothing is estimated.
          </p>
        </header>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Endpoints</h2>
          <ul className="space-y-2">
            {EXAMPLES.map((e) => (
              <li key={e.url} className="rounded-lg border border-border bg-card p-3">
                <div className="text-sm text-muted-foreground">{e.label}</div>
                <a href={e.url} className="font-mono text-sm break-all text-primary underline" target="_blank" rel="noreferrer">GET {e.url}</a>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Fields</h2>
          <p className="text-sm text-muted-foreground font-mono">id, category, subcategory, title, value, sub, period, asOf, nextDue, cadence, status, source, sourceUrl, derivedFrom, note</p>
          <p className="text-sm text-muted-foreground">
            <code>status</code> is <code>ok</code>, <code>unavailable</code> (source temporarily unreachable) or <code>no-feed</code> (publisher offers no machine-readable data). Responses are cached for five minutes and open to any website (CORS).
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Attribution</h2>
          <p className="text-sm text-muted-foreground">Please credit the original publisher named in <code>source</code>, and “via UKStats (ukstats.co.uk)”.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
