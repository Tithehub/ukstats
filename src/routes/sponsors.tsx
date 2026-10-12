import { reachKind, rowRegions } from "@/lib/sponsor-regions";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { visibleSponsors, type SponsorVisibilityRow } from "@/lib/sponsor-visibility";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/sponsors")({
  head: () => ({
    meta: [
      { title: "Our sponsors — UKStats" },
      { name: "description", content: "The businesses and people who keep UKStats free, open and ad-free. Sponsors never see or influence figures." },
      { property: "og:title", content: "Our sponsors — UKStats" },
      { property: "og:description", content: "Every business and supporter keeping UKStats' official statistics free." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/sponsors" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/sponsors" }],
  }),
  component: SponsorsPage,
});

type Row = SponsorVisibilityRow & { region: string | null; regions: string[] | null; plan: string | null };

function SponsorsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let env: string;
    try { env = getStripeEnvironment(); } catch { setRows([]); return; }
    supabase
      .from("sponsors")
      .select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,region,regions,plan")
      .order("plan", { ascending: true, nullsFirst: false })
      .then(({ data }) => setRows(visibleSponsors((data ?? []) as Row[], env)));
  }, []);

  const groups = new Map<string, Row[]>();
  for (const r of rows ?? []) {
    const k = reachKind(rowRegions(r));
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const rank = (k: string) => (k === "Worldwide" ? 0 : k === "Regional" ? 1 : 2);
  const ordered = [...groups].sort((x, y) => rank(x[0]) - rank(y[0]));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Thank you</p>
        <h1 className="mt-2 text-3xl font-semibold">Our sponsors</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          These businesses and people keep UKStats free, open and ad-free. Sponsors never see or influence any figure.
        </p>
        {rows === null ? (
          <p className="mt-8 text-night-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-8">No sponsors yet. <Link to="/advertise" className="text-electric-soft underline">Be the first</Link>.</p>
        ) : (
          ordered.map(([name, list]) => (
            <section key={name} className="mt-10">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-night-muted">{name}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <li key={s.id} className="rounded-md border border-night-line bg-night-panel/60 p-4">
                    <a href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="hover:text-electric-soft">
                      <p className="font-semibold">{s.name}</p>
                      {s.tagline ? <p className="mt-1 text-sm text-night-muted">{s.tagline}</p> : null}
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">{s.plan === "sponsor" ? "Sponsor" : "Supporter"}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <p className="mt-12 text-sm"><Link to="/advertise" className="text-electric-soft underline">Sponsor UKStats</Link> — from £5/month.</p>
      </main>
      <SiteFooter />
    </>
  );
}
