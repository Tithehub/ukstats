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
import { worldWellbeingQuery } from "@/lib/world-wellbeing.functions";
import { rankCountries, type WellbeingList } from "@/lib/world-wellbeing";
import { COUNTRIES } from "@/lib/countries";
import { NATIONS, WELLBEING_MEASURES, rankByMeasure, type Nation, type Place, type WellbeingKey } from "@/lib/places";

type Search = { view?: "countries" | undefined; q?: string | undefined; nation?: Nation | undefined; sort?: WellbeingKey | undefined };

export const Route = createFileRoute("/happiest-places")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    view: s["view"] === "countries" ? "countries" : undefined,
    q: typeof s["q"] === "string" ? s["q"].slice(0, 60) : undefined,
    nation: NATIONS.find((n) => n === s["nation"]),
    sort: WELLBEING_MEASURES.find((m) => m.key === s["sort"])?.key,
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(placesQuery()), context.queryClient.ensureQueryData(worldWellbeingQuery())]),
  head: () => ({
    meta: [
      { title: "Happiest and saddest places to live — UK areas and countries | UKStats" },
      { name: "description", content: "Every council area in England, Scotland, Wales and Northern Ireland ranked by ONS life satisfaction, happiness, worthwhile and anxiety — plus happiest and saddest countries from Eurostat and the World Happiness Report, with source and dates." },
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

function ViewSwitch({ view, set }: { view: Search["view"]; set: (s: Partial<Search>) => void }) {
  return (
    <div className="mb-6 flex gap-2" role="group" aria-label="Choose list">
      <Button size="sm" variant={!view ? "default" : "outline"} onClick={() => set({ view: undefined, q: undefined })}>UK places</Button>
      <Button size="sm" variant={view === "countries" ? "default" : "outline"} onClick={() => set({ view: "countries", q: undefined, nation: undefined })}>Countries</Button>
    </div>
  );
}

const countryLink = (id: string) => COUNTRIES.find((c) => c.eurostat === id)?.code;

function CountryTop({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: ReturnType<typeof rankCountries> }) {
  return (
    <section className="rounded-lg border border-night-line bg-night-panel p-4">
      <h3 className="flex items-center gap-2 font-semibold">{icon}{title}</h3>
      <ol className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className={r.id === "UK" || r.name === "United Kingdom" ? "font-semibold text-accent" : ""}><span className="mr-2 font-mono text-night-muted">{r.position}.</span>{r.name}</span>
            <span className="font-mono">{r.score!.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CountryList({ list, q }: { list: WellbeingList; q: string }) {
  const ranked = rankCountries(list.rows, true);
  const rows = ranked.filter((r) => !q || r.name.toLowerCase().includes(q));
  const unranked = list.rows.filter((r) => !r.ranked && (!q || r.name.toLowerCase().includes(q)));
  const research = list.kind === "research";
  return (
    <section className={`mt-8 rounded-lg border p-4 ${research ? "border-ageing" : "border-night-line"}`}>
      <h2 className="text-xl font-semibold">{research ? "Research list — not an official statistic" : "Official list"}</h2>
      <p className="mt-1 text-sm text-night-muted">
        {research
          ? "World Happiness Report: average answer to Gallup's 0–10 'ladder' question about life overall. Polling by a private company, not a government statistic. Covers about 140 countries."
          : "Eurostat (EU statistics office): average overall life satisfaction, 0–10, from the EU-SILC survey of people aged 16+. Covers EU, EFTA and candidate countries."}
      </p>
      <p className="mt-1 font-mono text-[11px] text-night-muted">
        Source: <a className="underline" href={list.source.url} target="_blank" rel="noreferrer">{list.source.name}</a> · Period: {list.source.period}{list.source.published ? ` · Published/updated: ${list.source.published}` : ""} · Next release: not announced
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CountryTop title="Top 10 happiest" icon={<Smile className="size-5 text-fresh" aria-hidden="true" />} rows={ranked.slice(0, 10)} />
        <CountryTop title="Top 10 saddest" icon={<Frown className="size-5 text-overdue" aria-hidden="true" />} rows={rankCountries(list.rows, false).slice(0, 10)} />
      </div>
      <div className="mt-4 max-h-[32rem] overflow-auto rounded-lg border border-night-line">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-night-panel text-left"><tr><th className="p-2">#</th><th className="p-2">Country</th><th className="p-2">Score (0–10)</th><th className="p-2">Year</th></tr></thead>
          <tbody>
            {[...rows, ...unranked.map((r) => ({ ...r, position: 0 }))].map((r) => {
              const code = countryLink(r.id);
              return (
                <tr key={r.id} className="border-t border-night-line">
                  <td className="p-2 font-mono text-night-muted">{r.position || "—"}</td>
                  <td className="p-2">{code ? <Link className="underline" to="/$country" params={{ country: code }}>{r.name}</Link> : r.name}</td>
                  <td className="p-2"><Score v={r.score} /></td>
                  <td className="p-2 font-mono text-night-muted">{r.year ?? "—"}{r.score != null && !r.ranked ? " · too old to rank" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CountriesView({ q, set, search }: { q: string; set: (s: Partial<Search>) => void; search: Search }) {
  const { data } = useSuspenseQuery(worldWellbeingQuery());
  return (
    <>
      <h1 className="text-3xl font-semibold">Happiest and saddest countries</h1>
      <p className="mt-3 max-w-3xl text-sm text-night-muted">
        Two lists, shown side by side and never combined: an official list from Eurostat, and a wider research list from the World Happiness Report. They measure different questions, so a country's position in one should not be compared with the other. Figures more than {3} years older than the newest in a list are shown but not ranked.
      </p>
      <Input aria-label="Search countries" placeholder="Search a country…" defaultValue={search.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} className="mt-4 max-w-xs" />
      {data.official ? <CountryList list={data.official} q={q} /> : (
        <section className="mt-8 rounded-lg border border-night-line p-4 text-sm">Official list: Eurostat did not answer — <a className="underline" href="https://ec.europa.eu/eurostat/databrowser/view/ilc_pw01/default/table" target="_blank" rel="noreferrer">No live feed</a>. Nothing is shown rather than a guess.</section>
      )}
      <CountryList list={data.research} q={q} />
      <p className="mt-3 text-xs text-night-muted">
        OECD How's Life? life satisfaction: the OECD data service is not currently returning this table — <a className="underline" href="https://www.oecd.org/en/data/datasets/how-s-life-well-being-database.html" target="_blank" rel="noreferrer">No live feed</a>.
      </p>
    </>
  );
}

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/happiest-places" });
  const setView = (s: Partial<Search>) => void navigate({ search: (prev) => ({ ...prev, ...s }), replace: true });
  if (search.view === "countries") {
    return (
      <div className="min-h-screen bg-night text-night-fg">
        <SiteHeader />
        <UkTopicNav />
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <ViewSwitch view={search.view} set={setView} />
          <CountriesView q={(search.q ?? "").toLowerCase()} set={setView} search={search} />
        </main>
        <SiteFooter />
      </div>
    );
  }
  return <UkPage />;
}

function UkPage() {
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
        <ViewSwitch view={search.view} set={set} />
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
