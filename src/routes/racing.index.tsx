import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { ExampleBadge, NoFeed, RacingLayout, Silk, Stat } from "@/components/racing/RacingLayout";
import { RACECOURSES, RACECOURSES_CHECKED, RACECOURSES_SOURCE } from "@/lib/racing/racecourses.data";

import { racecardsQuery, type MeetingRow, type RaceRow } from "@/lib/racing/racing.functions";
import { distanceLabel, lastForm, weightLabel, type RaceDay } from "@/lib/racing/racing";
import { fmtDate } from "@/lib/uk-stats";

type Search = { day?: RaceDay | undefined; course?: string | undefined; type?: string | undefined; going?: string | undefined; status?: string | undefined };
const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 60) : undefined);

export const Route = createFileRoute("/racing/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    day: s["day"] === "tomorrow" || s["day"] === "upcoming" ? s["day"] : undefined,
    course: str(s["course"]), type: str(s["type"]), going: str(s["going"]), status: str(s["status"]),
  }),
  loaderDeps: ({ search }) => ({ day: search.day ?? "today" }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(racecardsQuery(deps.day)),
  head: () => ({
    meta: [
      { title: "UK horse racing dashboard and racecards | UKStats" },
      { name: "description", content: "Free UK horse racing statistics: today's, tomorrow's and upcoming meetings, racecards, non-runners and results from licensed data — no betting." },
      { property: "og:title", content: "UK horse racing dashboard — UKStats" },
      { property: "og:description", content: "Racecards, runners, non-runners and results from licensed racing data. Free, 18+, no betting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

const DAYS: { key: RaceDay; label: string }[] = [{ key: "today", label: "Today's racing" }, { key: "tomorrow", label: "Tomorrow's racing" }, { key: "upcoming", label: "Upcoming fixtures" }];
const time = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function Page() {
  const search = Route.useSearch();
  const day = search.day ?? "today";
  const nav = useNavigate({ from: "/racing/" });
  const { data } = useSuspenseQuery(racecardsQuery(day));
  const set = (p: Partial<Search>) => nav({ search: (s) => ({ ...s, ...p }), replace: true });

  const races = data.meetings.flatMap((m) => m.races.map((r) => ({ m, r })));
  const runners = races.flatMap(({ r }) => r.runners);
  const nr = runners.filter((x) => x.non_runner).length;
  const next = races.filter(({ r }) => r.status === "scheduled" && new Date(r.off_time).getTime() > Date.now()).sort((a, b) => a.r.off_time.localeCompare(b.r.off_time))[0];
  const opts = (f: (m: MeetingRow, r: RaceRow) => string | null | undefined) => [...new Set(races.map(({ m, r }) => f(m, r)).filter((x): x is string => !!x))].sort();
  const shown = data.meetings
    .filter((m) => !search.course || m.course?.name === search.course)
    .map((m) => ({ ...m, races: m.races.filter((r) => (!search.type || r.race_type === search.type) && (!search.going || (r.going ?? m.going) === search.going) && (!search.status || r.status === search.status)) }))
    .filter((m) => m.races.length);
  const connected = data.sources.filter((s) => s.status === "connected");

  return <RacingLayout demo={data.demo} title="Horse racing" intro="Free UK racing statistics: meetings, racecards, non-runners and results, at every licensed UK racecourse.">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Meetings" value={data.meetings.length} />
      <Stat label="Races" value={races.length} />
      <Stat label="Declared runners" value={runners.length - nr} />
      <Stat label="Non-runners" value={nr} />
      <Stat label="Next race" value={next ? time(next.r.off_time) : "—"} note={next ? `${next.m.course?.name ?? ""} · ${next.r.name}` : undefined} />
      <Stat label="Data feed" value={data.demo ? "Example data" : data.provider ? "The Racing API" : connected.length ? "Connected" : "Not connected"} note={data.fetchedAt ? `Updated ${new Date(data.fetchedAt).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" })}${data.error ? " · " + data.error : ""} · no odds on current plan` : "No licensed odds feed"} />
    </div>

    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Choose day">
      {DAYS.map((d) => <button key={d.key} onClick={() => set({ day: d.key === "today" ? undefined : d.key })}
        className={`min-h-11 rounded-md border px-4 text-sm font-semibold ${day === d.key ? "border-racing-gold bg-racing-gold text-night" : "border-night-line text-night-fg"}`}>{d.label}</button>)}
    </div>

    {races.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Filter label="Racecourse" value={search.course} options={opts((m) => m.course?.name)} onChange={(v) => set({ course: v })} />
      <Filter label="Race type" value={search.type} options={opts((_, r) => r.race_type)} onChange={(v) => set({ type: v })} />
      <Filter label="Going" value={search.going} options={opts((m, r) => r.going ?? m.going)} onChange={(v) => set({ going: v })} />
      <Filter label="Status" value={search.status} options={opts((_, r) => r.status)} onChange={(v) => set({ status: v })} />
    </div>}

    <div className="mt-6 space-y-8">
      {data.error ? <NoFeed sources={data.sources} what="racecards" /> : !shown.length ? <NoFeed sources={data.sources} what="racecards" /> : shown.map((m) => <section key={m.id}>
        <h2 className="text-xl font-bold">{m.course?.name ?? "Racecourse"} <span className="text-sm font-normal text-night-muted">· {fmtDate(m.meeting_date)}{m.going ? ` · Going: ${m.going}` : ""}{m.surface ? ` · ${m.surface}` : ""}{m.status !== "scheduled" ? ` · ${m.status}` : ""}</span></h2>
        <div className="mt-3 space-y-4">{m.races.map((r) => <RaceCard key={r.id} r={r} demo={data.demo} />)}</div>
      </section>)}
    </div>

    <Courses />

    <p className="mt-8 text-sm text-night-muted">AI predictions and the free AI-vs-human competition arrive once a licensed feed is connected. <Link to="/racing/competitions" search={{}} className="text-electric-soft underline">How the competition will work →</Link></p>
  </RacingLayout>;
}

function Courses() {
  const [q, setQ] = useState("");
  const list = RACECOURSES.filter((c) => (c.name + c.town + c.nation).toLowerCase().includes(q.toLowerCase()));
  return <section className="mt-10" aria-labelledby="courses-h">
    <h2 id="courses-h" className="text-2xl font-bold">All {RACECOURSES.length} UK racecourses</h2>
    <p className="mt-1 text-sm text-night-muted">59 licensed courses in Great Britain plus Down Royal and Downpatrick in Northern Ireland. Course facts from the <a href={RACECOURSES_SOURCE} target="_blank" rel="noreferrer" className="underline">British Horseracing Authority</a>, checked {fmtDate(RACECOURSES_CHECKED)}.</p>
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses or towns" aria-label="Search racecourses" className="mt-3 min-h-11 w-full max-w-sm rounded-md border border-night-line bg-night-panel px-3 text-sm" />
    <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <li key={c.id} className="rounded-lg border border-night-line bg-night-panel p-3">
      <div className="font-semibold">{c.name}</div>
      <div className="text-xs text-night-muted">{c.town}, {c.nation} · {c.code} · {c.surface}</div>
    </li>)}</ul>
  </section>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string | undefined; options: string[]; onChange: (v: string | undefined) => void }) {
  return <label className="text-xs text-night-muted">{label}
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className="mt-1 block min-h-11 w-full rounded-md border border-night-line bg-night-panel px-2 text-sm text-night-fg">
      <option value="">All</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select></label>;
}

function RaceCard({ r, demo }: { r: RaceRow; demo: boolean }) {
  const rows = [...r.runners].sort((a, b) => (a.cloth_number ?? 99) - (b.cloth_number ?? 99));
  return <article className="overflow-hidden rounded-lg border border-night-line bg-night-panel">
    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-night-line px-4 py-3">
      <span className="font-mono text-lg font-bold text-racing-gold">{time(r.off_time)}</span>
      <span className="font-semibold">{r.name}</span>
      <span className="text-xs text-night-muted">{[distanceLabel(r.distance_yards), r.race_type, r.class && `Class ${r.class}`, r.prize_gbp != null && `£${r.prize_gbp.toLocaleString("en-GB")}`, r.going, `${rows.filter((x) => !x.non_runner).length} runners`, r.status !== "scheduled" && r.status].filter(Boolean).join(" · ")}</span>
    </header>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="text-left font-mono text-[11px] uppercase tracking-wider text-night-muted"><tr>
          {["No.", "Draw", "Horse", "Age/Sex", "Wgt", "OR", "Form", "Trainer", "Jockey", "Odds", "AI"].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((x) => <tr key={x.id} className={`border-t border-night-line ${x.non_runner ? "opacity-50" : ""}`}>
          <td className="px-3 py-2 font-mono">{x.cloth_number ?? "—"}</td>
          <td className="px-3 py-2 font-mono">{x.draw ?? "—"}</td>
          <td className="px-3 py-2 font-semibold">{x.horse ? <><Silk id={x.horse.id} /><Link to="/racing/horses/$id" params={{ id: x.horse.id }} className="hover:underline">{x.horse.name}</Link>{demo && <ExampleBadge />}</> : "—"}{x.headgear ? <span className="ml-1 text-xs text-night-muted">({x.headgear})</span> : null}{x.non_runner && <span className="ml-2 rounded bg-destructive px-1.5 text-xs text-destructive-foreground">Non-runner</span>}</td>
          <td className="px-3 py-2">{x.age ?? "—"}{x.horse?.sex ? ` ${x.horse.sex}` : ""}</td>
          <td className="px-3 py-2 font-mono">{weightLabel(x.weight_lbs)}</td>
          <td className="px-3 py-2 font-mono">{x.official_rating ?? "—"}</td>
          <td className="px-3 py-2 font-mono">{lastForm(x.form).join("") || "—"}</td>
          <td className="px-3 py-2">{x.trainer ? <Link to="/racing/people/$kind/$id" params={{ kind: "trainer", id: x.trainer.id }} className="hover:underline">{x.trainer.name}</Link> : "—"}</td>
          <td className="px-3 py-2">{x.jockey ? <Link to="/racing/people/$kind/$id" params={{ kind: "jockey", id: x.jockey.id }} className="hover:underline">{x.jockey.name}</Link> : "—"}</td>
          <td className="px-3 py-2 text-xs text-night-muted">No licensed feed</td>
          <td className="px-3 py-2 text-xs text-night-muted">Not yet</td>
        </tr>)}</tbody>
      </table>
    </div>
  </article>;
}
