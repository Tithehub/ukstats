import { SCANDAL_IMAGES } from "@/lib/scandals.images";
import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { UkTopicNav } from "@/components/UkTopicNav";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/uk-stats";
import { SCANDALS, SCANDALS_CHECKED } from "@/lib/scandals.data";
import { matchScandal } from "@/lib/scandals";

const T = "Scandals — official records, inquiries and headlines | UK Stats";
const D = "Grooming gangs, Post Office Horizon, Epstein files, Savile, Iraq, Covid and more: the official inquiries, court rulings and government records, with major headlines and videos clearly labelled.";

export const Route = createFileRoute("/scandals")({
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/scandals" }],
  }),
  component: Layout,
});

function Layout() {
  const matches = useMatches();
  const child = matches.some((m) => m.routeId === "/scandals/$slug");
  return child ? <Outlet /> : <Index />;
}

function Index() {
  const [q, setQ] = useState("");
  const list = SCANDALS.filter((s) => matchScandal(s, q));
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-night-muted">Official records first · News clearly labelled</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Scandals</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D}</p>
        <p className="mt-3 text-xs text-night-muted">Links checked {fmtDate(SCANDALS_CHECKED)}. Summaries say what an official body found, ruled or published — not UKStats' own view. Being named in a document is not evidence of wrongdoing.</p>
        <div className="mt-6"><UkTopicNav /></div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scandals" aria-label="Search scandals" className="mt-6 max-w-sm" />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.slug}>
              <Link to="/scandals/$slug" params={{ slug: s.slug }} className="block h-full overflow-hidden rounded-md border border-night-line bg-night-panel p-4 hover:border-electric-soft">
                {SCANDAL_IMAGES[s.slug] && <img src={SCANDAL_IMAGES[s.slug].src} alt={SCANDAL_IMAGES[s.slug].alt} loading="lazy" className="-mx-4 -mt-4 mb-3 aspect-[16/9] w-[calc(100%+2rem)] max-w-none object-cover" />}
                <div className="font-mono text-xs text-night-muted">{s.region}</div>
                <h2 className="mt-1 text-xl font-semibold">{s.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-night-muted">{s.summary}</p>
                <p className="mt-3 text-xs font-semibold">{s.status}</p>
                <p className="mt-1 font-mono text-xs text-night-muted">{s.official.length} official · {s.headlines.length} news · {s.videos.length} video</p>
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 && <p className="mt-6 text-night-muted">No scandal matches “{q}”.</p>}
      </main>
      <SiteFooter />
    </div>
  );
}
