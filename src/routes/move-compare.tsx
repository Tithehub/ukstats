import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { UkTopicNav } from "@/components/UkTopicNav";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { placesQuery } from "@/lib/places.functions";
import { FACTORS, HOUSEHOLDS, PRESET_WEIGHTS, UNOFFICIAL_LABEL, compare, factorPositions, type FactorKey, type Household, type Place, type PlacesPayload } from "@/lib/places";

type Search = { from?: string | undefined; to?: string | undefined; h?: Household | undefined; w?: string | undefined };

export const Route = createFileRoute("/move-compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    from: typeof s["from"] === "string" ? s["from"].slice(0, 12) : undefined,
    to: typeof s["to"] === "string" ? s["to"].slice(0, 12) : undefined,
    h: HOUSEHOLDS.find((x) => x.key === s["h"])?.key,
    w: typeof s["w"] === "string" && /^[\d,]{0,40}$/.test(s["w"]) ? s["w"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(placesQuery()),
  head: () => ({
    meta: [
      { title: "Thinking of moving? Unofficial UK quality-of-life comparison | UKStats" },
      { name: "description", content: "Compare two UK council areas on safety, housing cost, happiness, schools, retirement and pay — built from official figures, weighted for singles, couples, families or retirees. Unofficial test tool." },
      { property: "og:title", content: "Thinking of moving? Compare two UK places — UKStats" },
      { property: "og:description", content: "An unofficial quality-of-life comparison built only from official UK figures, with every source shown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
function rawLine(p: Place, f: FactorKey): string {
  switch (f) {
    case "safety": return p.crimeRate == null ? "No comparable figure" : `${p.crimeRate.toFixed(1)} crimes per 1,000`;
    case "cost": return p.housePrice == null || p.weeklyPay == null ? "No comparable figure" : `${gbp(p.housePrice)} avg price · ${(p.housePrice / (p.weeklyPay * 52)).toFixed(1)}× yearly pay`;
    case "happiness": return p.wellbeing?.lifeSatisfaction == null ? "No comparable figure" : `Life satisfaction ${p.wellbeing.lifeSatisfaction.toFixed(2)} · anxiety ${p.wellbeing.anxiety?.toFixed(2) ?? "—"}`;
    case "schools": return p.goodSchoolsShare == null ? "No comparable figure" : `${p.goodSchoolsShare}% Good or Outstanding${p.schoolsArea && p.schoolsArea !== p.name ? ` (${p.schoolsArea} county figure)` : ""}`;
    case "retirement": return p.over65Share == null ? "No comparable figure" : `${p.over65Share}% of residents aged 65+`;
    case "pay": return p.weeklyPay == null ? "No comparable figure" : `${gbp(p.weeklyPay)} median weekly pay`;
  }
}
const SRC: Record<FactorKey, keyof PlacesPayload["sources"]> = { safety: "crime", cost: "housePrice", happiness: "wellbeing", schools: "schools", retirement: "population", pay: "pay" };

function Page() {
  const { data } = useSuspenseQuery(placesQuery());
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/move-compare" });
  const h = s.h ?? "couple";
  const parsed = s.w?.split(",").map(Number);
  const weights = Object.fromEntries(FACTORS.map((f, i) => [f.key, parsed && parsed.length === FACTORS.length && Number.isFinite(parsed[i]) ? Math.min(100, parsed[i]!) : PRESET_WEIGHTS[h][f.key]])) as Record<FactorKey, number>;
  const positions = useMemo(() => factorPositions(data.places), [data.places]);
  const from = data.places.find((p) => p.code === s.from);
  const to = data.places.find((p) => p.code === s.to);
  const result = from && to ? compare(positions.get(from.code)!, positions.get(to.code)!, weights) : null;
  const set = (x: Partial<Search>) => void navigate({ search: (prev) => ({ ...prev, ...x }), replace: true });
  const setWeight = (k: FactorKey, v: number) => set({ w: FACTORS.map((f) => (f.key === k ? v : weights[f.key])).join(",") });

  const select = (label: string, value: string | undefined, key: "from" | "to") => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-wide text-night-muted">{label}</span>
      <select className="h-10 rounded-md border border-night-line bg-night-panel px-2" value={value ?? ""} onChange={(e) => set({ [key]: e.target.value || undefined })}>
        <option value="">Choose a place…</option>
        {data.places.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.nation})</option>)}
      </select>
    </label>
  );

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <UkTopicNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold">Thinking of moving? Compare two places</h1>
        <div role="note" className="mt-4 flex gap-2 rounded-lg border-2 border-ageing bg-ageing/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ageing" aria-hidden="true" />
          <p><strong>Unofficial tool, for testing purposes only.</strong> The score is UKStats' own weighting of official figures — it is not an official statistic and not advice. Every figure behind it is shown with its source.</p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
          {select("Moving from", s.from, "from")}
          <ArrowRight className="mx-auto hidden size-5 text-night-muted md:block" aria-hidden="true" />
          {select("Moving to", s.to, "to")}
        </section>

        <section className="mt-6 rounded-lg border border-night-line bg-night-panel p-4">
          <h2 className="font-semibold">Who is moving?</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOUSEHOLDS.map((x) => <Button key={x.key} size="sm" variant={h === x.key ? "default" : "outline"} aria-pressed={h === x.key} onClick={() => set({ h: x.key, w: undefined })}>{x.label}</Button>)}
          </div>
          <h2 className="mt-5 font-semibold">What matters most to you</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {FACTORS.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-sm"><span>{f.label}</span><span className="font-mono text-night-muted">{weights[f.key]}</span></div>
                <Slider aria-label={`${f.label} importance`} min={0} max={50} step={5} value={[weights[f.key]]} onValueChange={(v) => setWeight(f.key, v[0] ?? 0)} className="mt-2" />
                <p className="mt-1 text-[11px] text-night-muted">{f.help}</p>
              </div>
            ))}
          </div>
        </section>

        {result && from && to ? (
          <section className="mt-6" aria-live="polite">
            <div className="grid gap-4 md:grid-cols-2">
              {[{ p: from, r: result.from, t: "From" }, { p: to, r: result.to, t: "To" }].map(({ p, r, t }) => (
                <div key={t} className="rounded-lg border border-night-line bg-night-panel p-4">
                  <p className="font-mono text-[11px] uppercase text-night-muted">{t}</p>
                  <h3 className="text-xl font-semibold">{p.name} <span className="text-sm text-night-muted">· {p.nation}</span></h3>
                  <p className="mt-2 text-4xl font-bold">{r.score ?? "—"}<span className="text-base font-normal text-night-muted"> / 100</span></p>
                  <p className="text-[11px] text-night-muted">Unofficial score</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {FACTORS.map((f) => <li key={f.key}><span className="text-night-muted">{f.label}:</span> {rawLine(p, f.key)}{r.positions[f.key] != null ? <span className="font-mono text-night-muted"> · {r.positions[f.key]}/100</span> : null}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-night-line p-4">
              <h3 className="font-semibold">Moving to {to.name}, factor by factor</h3>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {FACTORS.map((f) => <li key={f.key}><strong>{f.label}:</strong> {result.verdicts[f.key]}</li>)}
              </ul>
              {result.dropped.length > 0 && <p className="mt-2 text-xs text-night-muted">Left out of both scores because a comparable official figure is missing for one place: {result.dropped.map((k) => FACTORS.find((f) => f.key === k)!.label).join(", ")}.</p>}
              <p className="mt-2 text-xs text-night-muted">{UNOFFICIAL_LABEL} Each factor is the place's position among all UK council areas (100 = best), weighted by your sliders. "Similar" means within 10 points.</p>
            </div>
          </section>
        ) : (
          <p className="mt-6 text-sm text-night-muted">Choose two places to see the comparison.</p>
        )}

        <section className="mt-8 text-xs text-night-muted">
          <h2 className="font-semibold text-night-fg">Official sources used</h2>
          <ul className="mt-2 space-y-1">
            {FACTORS.map((f) => { const src = data.sources[SRC[f.key]]; return <li key={f.key}>{f.label}: <a className="underline" href={src.url} target="_blank" rel="noreferrer">{src.name}</a> · {src.period ?? "—"}</li>; })}
          </ul>
          <p className="mt-2">Coverage gaps are left as gaps: recorded crime is England and Wales only, school ratings are England only, and resident pay is not published for Northern Ireland on this feed. Amenities (journey times to GPs, hospitals and town centres) are not yet connected. See also <Link className="underline" to="/happiest-places" search={{}}>happiest and saddest places</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
