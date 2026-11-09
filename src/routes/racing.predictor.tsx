import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RacingLayout, Silk } from "@/components/racing/RacingLayout";
import { racecardsQuery, type MeetingRow, type RaceRow } from "@/lib/racing/racing.functions";
import { predictRace, type Confidence } from "@/lib/racing/predictor";
import { reasoningQuery } from "@/lib/racing/predictor.functions";

type Day = "today" | "tomorrow";
export const Route = createFileRoute("/racing/predictor")({
  validateSearch: (s: Record<string, unknown>): { day?: Day | undefined; race?: string | undefined } => ({
    day: s["day"] === "tomorrow" ? "tomorrow" : undefined,
    race: typeof s["race"] === "string" ? s["race"].slice(0, 120) : undefined,
  }),
  loaderDeps: ({ search }) => ({ day: search.day ?? "today" }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(racecardsQuery(deps.day)),
  head: () => ({
    meta: [
      { title: "AI horse racing predictor — today's UK races | UKStats" },
      { name: "description", content: "The UKStats AI ranks every runner in today's and tomorrow's UK races from racecard form and ratings. Opinion for entertainment, no odds, 18+." },
      { property: "og:title", content: "UKStats AI horse racing predictor" },
      { property: "og:description", content: "See the AI's pick for every UK race and make your own — free, no betting, 18+." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
const CONF: Record<Confidence, number> = { Low: 1, Medium: 2, High: 3 };

function Page() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const day: Day = search.day ?? "today";
  const { data } = useSuspenseQuery(racecardsQuery(day));
  const all = data.meetings.flatMap((m) => m.races.map((r) => ({ m, r })));
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const next = now ? all.filter((x) => new Date(x.r.off_time).getTime() > now).sort((a, b) => a.r.off_time.localeCompare(b.r.off_time))[0] : undefined;
  const sel = all.find((x) => x.r.id === search.race) ?? next ?? all[0];

  return <RacingLayout title="AI Predictor" demo={data.demo} intro="The UKStats AI ranks every declared runner using only the facts on the racecard: recent form and official rating. It's an opinion for entertainment, not a statistic and not betting advice.">
    <div role="note" className="rounded-lg border-2 border-racing-gold bg-night-panel p-3 text-sm"><strong className="text-racing-gold">AI opinion for entertainment.</strong> Not a statistic, not betting advice. No odds or prices are used or shown.</div>

    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Choose day">
      {(["today", "tomorrow"] as const).map((d) => <button key={d} onClick={() => nav({ search: { day: d === "today" ? undefined : d, race: undefined } })}
        className={`min-h-11 rounded-md border px-4 text-sm font-semibold capitalize ${day === d ? "border-racing-gold bg-racing-gold text-night" : "border-night-line text-night-fg"}`}>{d}</button>)}
    </div>

    {!all.length ? <p className="mt-6 rounded-lg border border-night-line bg-night-panel p-4 text-sm">No racecards for {day} yet{data.error ? ` (${data.error})` : ""}.</p> :
      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Picker meetings={data.meetings} selected={sel?.r.id} nextId={next?.r.id} onPick={(id) => nav({ search: (s) => ({ ...s, race: id }), resetScroll: false })} />
        {sel && <Panel key={sel.r.id} race={sel.r} course={sel.m.course?.name ?? "Racecourse"} day={day} demo={data.demo} finished={now != null && new Date(sel.r.off_time).getTime() < now} />}
      </div>}
    <p className="mt-6 text-xs text-night-muted">Want to compete against the AI? <Link to="/racing/competitions" search={{}} className="text-electric-soft underline">How the free competition will work →</Link></p>
  </RacingLayout>;
}

function Picker({ meetings, selected, nextId, onPick }: { meetings: MeetingRow[]; selected?: string | undefined; nextId?: string | undefined; onPick: (id: string) => void }) {
  return <nav aria-label="Choose a race" className="space-y-3">
    {meetings.map((m) => <div key={m.id} className="rounded-lg border border-night-line bg-night-panel p-3">
      <p className="font-semibold">{m.course?.name}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5 lg:flex-col">{m.races.map((r) => <li key={r.id}>
        <button onClick={() => onPick(r.id)} aria-current={selected === r.id}
          className={`flex min-h-11 w-full items-center gap-2 rounded-md border px-2 text-left text-sm ${selected === r.id ? "border-racing-gold bg-racing-gold/15" : "border-night-line"}`}>
          <span className="font-mono font-bold text-racing-gold">{time(r.off_time)}</span>
          <span className="hidden truncate lg:inline">{r.name}</span>
          {nextId === r.id && <span className="ml-auto rounded bg-racing-gold px-1.5 font-mono text-[10px] font-bold uppercase text-night">Next off</span>}
        </button></li>)}</ul>
    </div>)}
  </nav>;
}

function Panel({ race, course, day, demo, finished }: { race: RaceRow; course: string; day: Day; demo: boolean; finished: boolean }) {
  const p = predictRace(race);
  const reason = useQuery({ ...reasoningQuery(race.id, day), enabled: p.ok && !demo });
  const key = `ukstats-racing-pick:${race.id}`;
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => { try { setMine(localStorage.getItem(key)); } catch { /* none */ } }, [key]);
  const pick = (id: string) => { setMine(id); try { localStorage.setItem(key, id); } catch { /* none */ } };

  return <section aria-labelledby="race-h">
    <h2 id="race-h" className="text-xl font-bold"><span className="font-mono text-racing-gold">{time(race.off_time)}</span> {course} — {race.name}</h2>
    {race.going && <p className="text-sm text-night-muted">Going: {race.going}</p>}
    {!p.ok ? <p className="mt-4 rounded-lg border-2 border-dashed border-night-line bg-night-panel p-5">{p.reason}</p> : <>
      {(() => { const t = p.ranked[0]!; return <div className="mt-4 rounded-xl border-2 border-racing-gold bg-night-panel p-5 shadow-[0_0_40px_-10px_var(--color-racing-gold)]">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-racing-gold">AI top pick{p.ranked[1]?.rank === 1 ? " (joint)" : ""}</p>
        <p className="mt-1 text-2xl font-bold">{t.runner.horse && <Silk id={t.runner.horse.id} />}{t.runner.horse?.name ?? "—"}</p>
        <p className="text-sm text-night-muted">No. {t.runner.cloth_number ?? "—"}{t.runner.draw != null ? ` · Draw ${t.runner.draw}` : ""}{t.runner.jockey ? ` · ${t.runner.jockey.name}` : ""}{t.runner.trainer ? ` · ${t.runner.trainer.name}` : ""}</p>
        <div className="mt-3 flex items-center gap-2 text-sm"><span className="text-night-muted">Confidence</span>
          <span className="flex gap-1" aria-hidden>{[1, 2, 3].map((i) => <span key={i} className={`h-2 w-8 rounded-full ${i <= CONF[p.confidence] ? "bg-racing-gold" : "bg-night-line"}`} />)}</span>
          <strong>{p.confidence}</strong></div>
        <div className="mt-4 border-t border-night-line pt-3 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">AI reasoning</p>
          <p className="mt-1">{demo ? "Reasoning is off for example data." : reason.isLoading ? "Writing reasoning…" : reason.data?.text ?? "Reasoning unavailable — the ranking below still applies."}</p>
          {reason.data?.generatedAt && <p className="mt-1 text-xs text-night-muted">Generated {time(reason.data.generatedAt)} from the racecard only.</p>}
        </div>
      </div>; })()}

      <p className="mt-4 text-sm">{finished ? "This race has started or finished. Result not available on the current data plan." : mine ? <>Your pick is saved on this device. AI vs you: <strong>{p.ranked[0]!.runner.horse?.name}</strong> vs <strong>{race.runners.find((r) => r.id === mine)?.horse?.name}</strong>.</> : "Tap \"My pick\" on a horse to set your own pick against the AI."}</p>

      <ol className="mt-3 space-y-2">{p.ranked.map((x) => { const top = p.ranked[0]!.score || 1; return <li key={x.runner.id} className={`rounded-lg border bg-night-panel p-3 ${mine === x.runner.id ? "border-electric-soft" : "border-night-line"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-7 font-mono text-lg font-bold text-racing-gold">{x.rank}</span>
          <span className="font-semibold">{x.runner.horse && <Silk id={x.runner.horse.id} />}{x.runner.horse?.name ?? "—"}</span>
          <span className="text-xs text-night-muted">No. {x.runner.cloth_number ?? "—"}</span>
          <button disabled={finished} onClick={() => pick(x.runner.id)} className={`ml-auto min-h-9 rounded-md border px-3 text-xs font-semibold disabled:opacity-40 ${mine === x.runner.id ? "border-electric-soft bg-electric-soft/20" : "border-night-line"}`}>{mine === x.runner.id ? "My pick ✓" : "My pick"}</button>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-night-line" aria-label={`AI score ${x.score} of 10`}><div className="h-full rounded-full bg-racing-gold" style={{ width: `${Math.max(4, (x.score / top) * 100)}%` }} /></div>
        {x.why.length > 0 && <ul className="mt-2 flex flex-wrap gap-1">{x.why.map((w) => <li key={w} className="rounded border border-night-line px-1.5 py-0.5 font-mono text-[11px] text-night-muted">{w}</li>)}</ul>}
      </li>; })}</ol>
    </>}
    {p.nonRunners.length > 0 && <p className="mt-3 text-sm text-night-muted">Non-runners (excluded): {p.nonRunners.map((r) => r.horse?.name).join(", ")}</p>}
  </section>;
}
