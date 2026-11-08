import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageLoading, PageNotFound } from "@/components/layout/PageFeedback";
import { ShareRow } from "@/components/ShareRow";
import { EduNav, fmtNum, SourceNote } from "@/components/education/EduShared";
import { educationSummaryQuery } from "@/lib/education.functions";
import { EDU_SOURCES, NO_FEED_LINKS } from "@/lib/education";
import { fmtDate } from "@/lib/uk-stats";

const T = "UK education statistics: schools, Ofsted, exam results and universities | UK Stats";
const D = "Official figures for every open school in England, latest Ofsted outcomes, GCSE and KS2 results, absence and registered universities — each with its source and date.";

export const Route = createFileRoute("/education/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(educationSummaryQuery()),
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/education" }],
  }),
  component: EducationPage,
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

const PHASE_ORDER = ["Primary", "Secondary", "All-through", "Nursery", "16 plus", "Middle deemed primary", "Middle deemed secondary", "Not applicable"];

function EducationPage() {
  const { data: s } = useSuspenseQuery(educationSummaryQuery());
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Education</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D} Each UK nation publishes its own measures, so they're shown separately and never added together.</p>
        <ShareRow className="mt-4" path="/education" title="UK education statistics — schools, Ofsted and exam results" sourceUrl={EDU_SOURCES.ees.url} sourceLabel="DfE source" />
        <EduNav />

        {!s ? (
          <div className="mt-8 rounded-md border border-night-line bg-night-panel p-6">
            <p className="font-semibold">No live feed yet</p>
            <p className="mt-1 text-sm text-night-muted">The first download from the Department for Education hasn't finished. No figures are shown rather than estimated ones. See <a className="underline" href={EDU_SOURCES.ees.url} target="_blank" rel="noreferrer">Explore Education Statistics</a>.</p>
          </div>
        ) : (
          <>
            <section className="mt-8" aria-labelledby="eng-heads">
              <h2 id="eng-heads" className="text-xl font-semibold">England — national figures</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.headlines.map((h) => (
                  <article key={h.key} className="rounded-md border border-night-line bg-night-panel p-4">
                    <p className="text-sm text-night-muted">{h.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{h.value == null ? <span className="text-lg text-night-muted">Not published</span> : <>{fmtNum(h.value, h.unit === "%" || h.unit === "points" ? 1 : 0)}{h.unit === "%" ? "%" : ""}</>}</p>
                    <p className="mt-2 font-mono text-[11px] text-night-muted">Academic year {h.period} · <a className="underline" href={h.url} target="_blank" rel="noreferrer">{h.publication}</a></p>
                  </article>
                ))}
              </div>
              <SourceNote>Source: {EDU_SOURCES.ees.name}, read {fmtDate(s.fetchedAt)}. Figures are the DfE's own national totals, not summed by UKStats. They update when the DfE publishes a new release.</SourceNote>
            </section>

            {s.gias && (
              <section className="mt-10" aria-labelledby="gias">
                <h2 id="gias" className="text-xl font-semibold">Open schools and colleges on the register</h2>
                <p className="mt-1 text-sm text-night-muted"><span className="font-mono text-night-fg">{fmtNum(s.gias.open)}</span> open establishments listed on {fmtDate(s.gias.date)}, including independent schools, colleges and nurseries. This is a count of register entries, not the school census total above.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PHASE_ORDER.filter((p) => s.gias!.byPhase[p]).map((p) => (
                    <Link key={p} to="/education/schools" search={{ phase: p }} className="rounded-md border border-night-line bg-night-panel px-3 py-2 text-sm hover:border-electric">
                      {p === "Not applicable" ? "Other (no phase)" : p} <span className="ml-1 font-mono text-night-muted">{fmtNum(s.gias!.byPhase[p])}</span>
                    </Link>
                  ))}
                </div>
                <SourceNote>Source: <a className="underline" href={EDU_SOURCES.gias.url} target="_blank" rel="noreferrer">{EDU_SOURCES.gias.name}</a>, downloaded daily.</SourceNote>
              </section>
            )}

            {s.ofsted && (
              <section className="mt-10" aria-labelledby="ofsted">
                <h2 id="ofsted" className="text-xl font-semibold">Ofsted — latest inspections of state-funded schools</h2>
                <p className="mt-1 text-sm text-night-muted">Ofsted moved to report cards in November 2025. Schools inspected before then still carry their older one-word or ungraded outcome, so the two are shown side by side and never combined.</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <article className="rounded-md border border-night-line bg-night-panel p-4">
                    <h3 className="font-semibold">Report cards — "Achievement" <span className="font-mono text-sm text-night-muted">({fmtNum(s.ofsted.reportCardSchools)} schools)</span></h3>
                    <Bars counts={s.ofsted.reportCard["Achievement"] ?? {}} order={["Exceptional", "Strong standard", "Expected standard", "Needs attention", "Urgent improvement"]} />
                    <p className="mt-2 text-xs text-night-muted">Safeguarding: {fmtNum(s.ofsted.reportCard["Safeguarding standards"]?.["Met"] ?? 0)} met, {fmtNum(s.ofsted.reportCard["Safeguarding standards"]?.["Not met"] ?? 0)} not met.</p>
                  </article>
                  <article className="rounded-md border border-night-line bg-night-panel p-4">
                    <h3 className="font-semibold">Older graded inspections — overall effectiveness <span className="font-mono text-sm text-night-muted">({fmtNum(s.ofsted.gradedSchools)} schools)</span></h3>
                    <Bars counts={s.ofsted.graded} order={["Outstanding", "Good", "Requires improvement", "Inadequate", "Not judged"]} />
                    <p className="mt-2 text-xs text-night-muted">A further {fmtNum(s.ofsted.ungradedSchools)} schools' latest visit was an ungraded inspection; {fmtNum(s.ofsted.none)} have no inspection on the list yet.</p>
                  </article>
                </div>
                <SourceNote>Source: <a className="underline" href={EDU_SOURCES.ofsted.url} target="_blank" rel="noreferrer">{EDU_SOURCES.ofsted.name}</a>, as at {fmtDate(s.ofsted.asAt)}. Published monthly.</SourceNote>
              </section>
            )}

            {s.providers && (
              <section className="mt-10 rounded-md border border-night-line bg-night-panel p-5">
                <h2 className="text-xl font-semibold">Universities and higher-education providers</h2>
                <p className="mt-1 text-sm text-night-muted"><span className="font-mono text-night-fg">{fmtNum(s.providers.count)}</span> providers on the Office for Students Register (England), read {fmtDate(s.providers.date)}.</p>
                <Link to="/education/universities" search={{}} className="mt-3 inline-block text-electric-soft underline">Browse every registered provider →</Link>
              </section>
            )}
          </>
        )}

        <section className="mt-10" aria-labelledby="devolved">
          <h2 id="devolved" className="text-xl font-semibold">Scotland, Wales, Northern Ireland and UK-wide higher education</h2>
          <p className="mt-1 text-sm text-night-muted">No live feed yet. These publishers don't offer a file we can read automatically, so no figures are shown here. Their official pages:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {NO_FEED_LINKS.map((l) => (
              <li key={l.url} className="rounded-md border border-night-line p-3 text-sm"><span className="font-mono text-[11px] uppercase text-night-muted">{l.nation}</span><br /><a className="text-electric-soft underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Bars({ counts, order }: { counts: Record<string, number>; order: string[] }) {
  const keys = [...order.filter((k) => counts[k]), ...Object.keys(counts).filter((k) => !order.includes(k))];
  const total = keys.reduce((a, k) => a + (counts[k] ?? 0), 0) || 1;
  return (
    <ul className="mt-3 space-y-2">
      {keys.map((k) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between"><span>{k}</span><span className="font-mono">{fmtNum(counts[k])} <span className="text-night-muted">({fmtNum((100 * (counts[k] ?? 0)) / total, 1)}%)</span></span></div>
          <div className="mt-1 h-2 rounded bg-night-line"><div className="h-2 rounded bg-electric" style={{ width: `${(100 * (counts[k] ?? 0)) / total}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
