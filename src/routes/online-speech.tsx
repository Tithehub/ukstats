import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Banner } from "@/components/Banner";
import { LIKE_FOR_LIKE_WARNING, SPEECH_ROWS } from "@/lib/online-speech";
import img from "@/assets/online-speech.jpg";

const T = "Online speech convictions by country — official sources | UK Stats";
const D = "Where the UK, Europe, the US, Canada and Australia publish convictions for offences involving online or electronic messages — with the caveats.";

export const Route = createFileRoute("/online-speech")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Banner src={img} alt="Courtroom gallery with a phone resting on a bench" eager />
        <h1 className="text-4xl font-semibold tracking-tight">Online speech convictions</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D}</p>
        <p className="mt-4 rounded-md border border-ageing/40 bg-night-panel p-3 text-sm">{LIKE_FOR_LIKE_WARNING}</p>
        <div className="mt-6 grid gap-3">
          {SPEECH_ROWS.map((r) => (
            <article key={r.code} className="rounded-md border border-night-line bg-night-panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{r.country}</h2>
                <span className="font-mono text-sm">{r.value ? `${r.value} · ${r.period}` : "No live feed"}</span>
              </div>
              <p className="mt-1 text-sm text-night-muted">{r.offences}</p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-xs text-night-muted">
                <dt>Release</dt><dd>{r.cadence}</dd>
                <dt>Caveat</dt><dd>{r.caveat}</dd>
              </dl>
              <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-electric-soft underline">Source: {r.source}</a>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-night-muted">No figure on this page is estimated. A count appears only once it can be read straight from the publisher's own table. See also <Link to="/compare-countries" search={{ metric: "hicp" }} className="underline">Compare countries</Link>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
