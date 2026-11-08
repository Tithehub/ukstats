import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageLoading } from "@/components/layout/PageFeedback";
import { ShareRow } from "@/components/ShareRow";
import { EduNav, Figure, fmtNum, SourceNote } from "@/components/education/EduShared";
import { institutionQuery } from "@/lib/education.functions";
import { EDU_SOURCES } from "@/lib/education";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/education/schools/$urn")({
  loader: async ({ context, params }) => {
    if (!/^\d{5,7}$/.test(params.urn)) throw notFound();
    const row = await context.queryClient.ensureQueryData(institutionQuery(`urn:${params.urn}`));
    if (!row) throw notFound();
    return { name: row.name, town: row.town, phase: row.phase };
  },
  head: ({ loaderData, params }) => {
    const t = loaderData ? `${loaderData.name}${loaderData.town ? `, ${loaderData.town}` : ""} — Ofsted and results | UK Stats` : "School not found | UK Stats";
    const d = loaderData ? `Official details for ${loaderData.name}: latest Ofsted inspection, GCSE results where published, pupil numbers and capacity, with sources and dates.` : "This school isn't on the official register of open schools.";
    return {
      meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }, ...(loaderData ? [] : [{ name: "robots", content: "noindex" }])],
      links: [{ rel: "canonical", href: `https://ukstats.co.uk/education/schools/${params.urn}` }],
    };
  },
  component: SchoolPage,
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  notFoundComponent: () => <main className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-2xl font-semibold">School not found</h1><p className="mt-2 text-night-muted">It may have closed or changed number. Search the register instead.</p><a className="mt-4 inline-block underline" href="/education/schools">Find a school</a></main>,
});

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="grid grid-cols-[10rem_1fr] gap-3 border-b border-night-line py-2 text-sm last:border-0"><dt className="text-night-muted">{k}</dt><dd>{v}</dd></div>;
}

function SchoolPage() {
  const { urn } = Route.useParams();
  const { data: s } = useSuspenseQuery(institutionQuery(`urn:${urn}`));
  if (!s) return null;
  const o = s.ofsted;
  const k = s.ks4;
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-night-muted">URN {urn} · {s.la}</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">{s.name}</h1>
        <p className="mt-2 text-night-muted">{[s.phase, s.type, s.town, s.postcode].filter(Boolean).join(" · ")}</p>
        <ShareRow className="mt-4" path={`/education/schools/${urn}`} title={`${s.name} — official school figures`} sourceUrl={`https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${urn}`} sourceLabel="DfE record" />
        <EduNav />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-night-line bg-night-panel p-5">
            <h2 className="text-lg font-semibold">About the school</h2>
            <dl className="mt-3">
              <Row k="Pupils" v={<Figure value={fmtNum(s.pupils)} />} />
              <Row k="Capacity" v={<Figure value={fmtNum(s.capacity)} />} />
              <Row k="Free school meals" v={<Figure value={fmtNum(s.fsm_pct, 1)} suffix="%" />} />
              <Row k="Ages" v={s.low_age != null && s.high_age != null ? `${s.low_age}–${s.high_age}` : <Figure value={null} />} />
              <Row k="Pupils taught" v={s.gender ?? <Figure value={null} />} />
              <Row k="Religious character" v={s.religious ?? "None"} />
              <Row k="Admissions" v={s.admissions ?? <Figure value={null} />} />
              <Row k="Trust" v={s.trust ?? "None"} />
              <Row k="Region" v={s.region ?? "—"} />
              <Row k="Website" v={s.website ? <a className="text-electric-soft underline" href={s.website} target="_blank" rel="noreferrer nofollow">{new URL(s.website).hostname}</a> : <Figure value={null} />} />
            </dl>
            <SourceNote>Source: <a className="underline" href={`https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${urn}`} target="_blank" rel="noreferrer">{EDU_SOURCES.gias.name}</a>, register file of {fmtDate(s.source_date)}{s.census_date ? `; pupil numbers from the school census of ${fmtDate(s.census_date)}` : ""}.</SourceNote>
          </section>

          <section className="rounded-md border border-night-line bg-night-panel p-5">
            <h2 className="text-lg font-semibold">Latest Ofsted inspection</h2>
            {!o || !o.framework ? <p className="mt-3 text-sm text-night-muted">This school has no inspection on Ofsted's state-funded schools list. Independent schools may be inspected by another body.</p> : (
              <>
                <p className="mt-2 text-sm">{o.framework === "report card" ? "Report card inspection" : o.framework === "graded" ? "Graded inspection (pre-report-card)" : "Ungraded inspection"} started {fmtDate(o.inspected)}{o.published ? `, published ${fmtDate(o.published)}` : ""}.</p>
                {o.headline && <p className="mt-2 text-xl font-semibold">{o.headline}</p>}
                {o.grades.length > 0 && <dl className="mt-3">{o.grades.map((g) => <Row key={g.area} k={g.area} v={<strong>{g.grade}</strong>} />)}</dl>}
                {o.categoryOfConcern && <p className="mt-2 text-sm">Category of concern: <strong>{o.categoryOfConcern}</strong></p>}
                {o.link && <a className="mt-3 inline-block text-electric-soft underline" href={o.link} target="_blank" rel="noreferrer">Read the Ofsted report</a>}
              </>
            )}
            <SourceNote>Source: <a className="underline" href={EDU_SOURCES.ofsted.url} target="_blank" rel="noreferrer">Ofsted management information</a>{o ? `, as at ${fmtDate(o.asAt)}` : ""}. Outcomes are Ofsted's own words.</SourceNote>
          </section>
        </div>

        <section className="mt-6 rounded-md border border-night-line bg-night-panel p-5">
          <h2 className="text-lg font-semibold">GCSE results (key stage 4)</h2>
          {!k ? <p className="mt-2 text-sm text-night-muted">Not published for this school — it may not have pupils at the end of year 11.</p> : (
            <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
              <Row k="Attainment 8" v={<Figure value={fmtNum(k.values.attainment8, 1)} />} />
              <Row k="Progress 8" v={<Figure value={fmtNum(k.values.progress8, 2)} />} />
              <Row k="Grade 5+ English & maths" v={<Figure value={fmtNum(k.values.grade5EM, 1)} suffix="%" />} />
              <Row k="Grade 4+ English & maths" v={<Figure value={fmtNum(k.values.grade4EM, 1)} suffix="%" />} />
              <Row k="Pupils at end of KS4" v={<Figure value={fmtNum(k.values.pupils)} />} />
            </dl>
          )}
          <SourceNote>Source: <a className="underline" href={EDU_SOURCES.ks4.url} target="_blank" rel="noreferrer">{EDU_SOURCES.ks4.name}</a>{k ? `, academic year ${k.period}` : ""}. "Not published" means the DfE suppressed or did not calculate the figure. Progress 8 was not published for 2024/25 and 2025/26 because there were no KS2 results for those pupils. Primary (KS2) results: <a className="underline" href={`https://www.compare-school-performance.service.gov.uk/school/${urn}`} target="_blank" rel="noreferrer">DfE school performance page</a>.</SourceNote>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
