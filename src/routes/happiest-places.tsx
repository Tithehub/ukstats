import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Smile, Frown, ArrowRightLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { UkTopicNav } from "@/components/UkTopicNav";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placesQuery } from "@/lib/places.functions";
import { NATIONS, WELLBEING_MEASURES, rankByMeasure, type Nation, type Place, type WellbeingKey } from "@/lib/places";

type Search = { q?: string | undefined; nation?: Nation | undefined; sort?: WellbeingKey | undefined };

export const Route = createFileRoute("/happiest-places")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"].slice(0, 60) : undefined,
    nation: NATIONS.find((n) => n === s["nation"]),
    sort: WELLBEING_MEASURES.find((m) => m.key === s["sort"])?.key,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(placesQuery()),
  head: () => ({
    meta: [
      { title: "Happiest and saddest places to live in the UK — official ONS well-being | UKStats" },
      { name: "description", content: "Every council area in England, Scotland, Wales and Northern Ireland ranked by ONS life satisfaction, happiness, worthwhile and anxiety — with source and dates." },
      { property: "og:title", content: "Happiest and saddest places to live in the UK — UKStats" },
      { property: "og:description", content: "Official ONS personal well-being for every UK council area. Top 10 happiest, top 10 saddest, full list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

const fmt = (v: number | null | undefined) => (v == null ? null : v.toFixed(2));

function Score({ v }: { v: number | null | undefined }) {
  const s = fmt(v);
  return s == null ? <span className="text-night-muted">Not published</span> : <span className="font-mono">{s}</span>;
}

function TopList({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: Place[] }) {
  return (
    <section className="rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
      <ol className="mt-3 space-y-1.5">
        {rows.map((p, i) => (
          <li key={p.code} className="flex items-baseline justify-between gap-3 text-sm">
            <span><span className="mr-2 font-mono text-night-muted">{i + 1}.</span>{p.name} <span className="text-xs text-night-muted">· {p.nation}</span></span>
            <Score v={p.wellbeing?.happiness} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Page() {
  const { data } = useSuspenseQuery(placesQuery());
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/happiest-places" });
  const sort = search.sort ?? "happiness";
  const src = data.sources.wellbeing;
  const happiest = rankByMeasure(data.places, "happiness", true).slice(0, 10);
  const saddest = rankByMeasure(data.places, "happiness", false).slice(0, 10);
  const q = (search.q ?? "").toLowerCase();
  const filtered = data.places.filter((p) => (!search.nation || p.nation === search.nation) && (!q || p.name.toLowerCase().includes(q)));
  const ranked = rankByMeasure(filtered, sort, true);
  const unranked = filtered.filter((p) => p.wellbeing?.[sort] == null);
  const set = (s: Partial<Search>) => void navigate({ search: (prev) => ({ ...prev, ...s }), replace: true });

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <UkTopicNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">Happiest and saddest places to live in the UK</h1>
        <p className="mt-3 max-w-3xl text-sm text-night-muted">
          Official ONS personal well-being scores (0–10) for every council area in England, Scotland, Wales and Northern Ireland. Towns and cities are shown as their council area. Where ONS marks an estimate unreliable or does not publish it, the area shows "Not published" and is not ranked.
        </p>
        <p className="mt-2 font-mono text-[11px] text-night-muted">
          Source: <a className="underline" href={src.url} target="_blank" rel="noreferrer">{src.name}</a> · Period: {src.period ?? "—"} · Next release: not yet announced by ONS
        </p>
        <div className="mt-4">
          <Button asChild size="sm"><Link to="/move-compare" search={{}}><ArrowRightLeft />Thinking of moving? Compare two places (unofficial)</Link></Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TopList title="Top 10 happiest" icon={<Smile className="size-5 text-fresh" aria-hidden="true" />} rows={happiest} />
          <TopList title="Top 10 saddest (lowest happiness)" icon={<Frown className="size-5 text-overdue" aria-hidden="true" />} rows={saddest} />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Every area</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input aria-label="Search places" placeholder="Search a council area…" defaultValue={search.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} className="max-w-xs" />
            <Button size="sm" variant={!search.nation ? "default" : "outline"} onClick={() => set({ nation: undefined })}>All UK</Button>
            {NATIONS.map((n) => <Button key={n} size="sm" variant={search.nation === n ? "default" : "outline"} onClick={() => set({ nation: n })}>{n}</Button>)}
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border border-night-line">
            <table className="w-full text-sm">
              <thead className="bg-night-panel text-left">
                <tr>
                  <th className="p-2">#</th><th className="p-2">Area</th>
                  {WELLBEING_MEASURES.map((m) => (
                    <th key={m.key} className="p-2">
                      <button type="button" className={sort === m.key ? "underline" : ""} onClick={() => set({ sort: m.key })}>{m.label}{m.lowerIsBetter ? " (lower is better)" : ""}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...ranked, ...unranked].map((p, i) => (
                  <tr key={p.code} className="border-t border-night-line">
                    <td className="p-2 font-mono text-night-muted">{i < ranked.length ? i + 1 : "—"}</td>
                    <td className="p-2">{p.name} <span className="text-xs text-night-muted">· {p.nation}</span></td>
                    {WELLBEING_MEASURES.map((m) => <td key={m.key} className="p-2"><Score v={p.wellbeing?.[m.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-night-muted">
            Republic of Ireland: no comparable official score for each area is published (CSO) — <a className="underline" href="https://www.cso.ie/en/statistics/socialconditions/" target="_blank" rel="noreferrer">No live feed</a>. Councils merged after ONS's survey period appear without scores until ONS publishes for them.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
