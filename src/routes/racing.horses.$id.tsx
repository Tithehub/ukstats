import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { RacingLayout, Stat } from "@/components/racing/RacingLayout";
import fence from "@/assets/racing/fence.jpg";

import { horseQuery, type CareerRun } from "@/lib/racing/racing.functions";
import { distanceLabel, weightLabel, winRate } from "@/lib/racing/racing";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/racing/horses/$id")({
  loader: async ({ context, params }) => { const d = await context.queryClient.ensureQueryData(horseQuery(params.id)); if (!d) throw notFound(); return { name: d.horse.name }; },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.name} — career record and form | UKStats racing` },
      { name: "description", content: `${loaderData.name}: career starts, wins, places and full race history from licensed racing data.` },
      { property: "og:title", content: `${loaderData.name} — UKStats racing` },
      { property: "og:description", content: `Career record and form for ${loaderData.name}.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ] : [{ title: "Horse unavailable | UKStats" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

/** Aggregates a split (by going, distance or course) — each with its own sample size. */
function splits(runs: CareerRun[], key: (r: CareerRun) => string | null) {
  const m = new Map<string, { runs: number; wins: number }>();
  for (const r of runs) { const k = key(r); if (!k || r.position == null && !r.status) continue; const v = m.get(k) ?? { runs: 0, wins: 0 }; v.runs++; if (r.position === 1) v.wins++; m.set(k, v); }
  return [...m.entries()].sort((a, b) => b[1].runs - a[1].runs);
}

function Page() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(horseQuery(id));
  if (!data) return null;
  const { horse, career } = data;
  const ran = career.filter((r) => r.position != null || r.status);
  const wins = ran.filter((r) => r.position === 1).length, places = ran.filter((r) => r.position != null && r.position <= 3).length;
  const ratings = career.filter((r) => r.rating != null).reverse();
  const max = Math.max(1, ...ratings.map((r) => r.rating!)), min = Math.min(...ratings.map((r) => r.rating!), max);
  return <RacingLayout demo={data.demo} image={fence} title={data.demo ? `${horse.name} (example)` : horse.name} intro={<>{[horse.sex, horse.foaled && `foaled ${fmtDate(horse.foaled)}`, horse.country, horse.sire && `by ${horse.sire}`, horse.dam && `out of ${horse.dam}`].filter(Boolean).join(" · ") || "Breeding not published"}{horse.trainer && <> · Trainer <Link to="/racing/people/$kind/$id" params={{ kind: "trainer", id: horse.trainer.id }} className="underline">{horse.trainer.name}</Link></>}{horse.aliases.length ? ` · Also known as ${horse.aliases.map((a) => a.alias).join(", ")}` : ""}</>}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Starts with a result" value={ran.length} />
      <Stat label="Wins" value={wins} note={winRate(wins, ran.length).label} />
      <Stat label="Placed (1st–3rd)" value={places} note={winRate(places, ran.length).label} />
      <Stat label="Latest official rating" value={ratings.at(-1)?.rating ?? "—"} />
    </div>
    <p className="mt-2 text-xs text-night-muted">{data.demo ? "Example figures calculated from invented placings — not real results." : "Counts and percentages are UKStats calculations from the official results we hold; they are not official figures."}</p>

    {ratings.length > 1 && <section className="mt-6 rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="font-semibold">Official rating over time</h2>
      <svg viewBox="0 0 300 60" className="mt-2 h-24 w-full" preserveAspectRatio="none" aria-label="Official rating chart">
        <polyline fill="none" strokeWidth={2} className="stroke-racing-gold" points={ratings.map((r, i) => `${(i / (ratings.length - 1)) * 300},${55 - ((r.rating! - min) / Math.max(1, max - min)) * 50}`).join(" ")} />
      </svg>
      <p className="text-xs text-night-muted">{min} to {max} across {ratings.length} declarations</p>
    </section>}

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {([["By going", (r: CareerRun) => r.going], ["By distance", (r: CareerRun) => r.distance_yards ? distanceLabel(r.distance_yards) : null], ["By course", (r: CareerRun) => r.course]] as const).map(([t, f]) => <section key={t} className="rounded-lg border border-night-line bg-night-panel p-4">
        <h2 className="font-semibold">{t}</h2>
        {splits(ran, f).length ? <ul className="mt-2 space-y-1 text-sm">{splits(ran, f).slice(0, 8).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{k}</span><span className="font-mono text-night-muted">{winRate(v.wins, v.runs).label}</span></li>)}</ul> : <p className="mt-2 text-sm text-night-muted">No results recorded.</p>}
      </section>)}
    </div>

    <section className="mt-6">
      <h2 className="text-xl font-bold">Race history</h2>
      {!career.length ? <p className="mt-2 text-night-muted">No races recorded for this horse.</p> :
        <div className="mt-3 overflow-x-auto rounded-lg border border-night-line bg-night-panel"><table className="w-full min-w-[680px] text-sm">
          <thead className="text-left font-mono text-[11px] uppercase tracking-wider text-night-muted"><tr>{["Date", "Course", "Race", "Dist", "Going", "Wgt", "OR", "Pos", "SP"].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead>
          <tbody>{career.map((r, i) => <tr key={r.race_id} className={`border-t border-night-line ${i < 5 ? "bg-night/40" : ""}`}>
            <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.off_time)}</td><td className="px-3 py-2">{r.course ?? "—"}</td><td className="px-3 py-2">{r.race}</td>
            <td className="px-3 py-2 font-mono">{distanceLabel(r.distance_yards)}</td><td className="px-3 py-2">{r.going ?? "—"}</td>
            <td className="px-3 py-2 font-mono">{weightLabel(r.weight_lbs)}</td><td className="px-3 py-2 font-mono">{r.rating ?? "—"}</td>
            <td className="px-3 py-2 font-mono font-bold">{r.position ?? (r.status && r.status !== "finished" ? r.status : "—")}</td>
            <td className="px-3 py-2 font-mono">{r.sp != null ? r.sp.toFixed(2) : "—"}</td>
          </tr>)}</tbody>
        </table></div>}
      {career.length > 0 && <p className="mt-2 text-xs text-night-muted">The last five races are highlighted. SP is the official starting price in decimal form, shown for history only.</p>}
    </section>
  </RacingLayout>;
}
