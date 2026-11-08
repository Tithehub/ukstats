import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageLoading, PageNotFound } from "@/components/layout/PageFeedback";
import { EduNav, fmtNum, OfstedSummaryLine, SourceNote } from "@/components/education/EduShared";
import { educationSummaryQuery, institutionsQuery } from "@/lib/education.functions";
import { EDU_SOURCES, PHASES } from "@/lib/education";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface S { q?: string; phase?: string; la?: string; page?: number }

const T = "Find a school in England — Ofsted, results and pupil numbers | UK Stats";
const D = "Search every open school and college in England by name, town or postcode. See its latest Ofsted outcome, GCSE results and pupil numbers from official sources.";

export const Route = createFileRoute("/education/schools/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 80) : undefined,
    phase: typeof s["phase"] === "string" && s["phase"] ? s["phase"] : undefined,
    la: typeof s["la"] === "string" && s["la"] ? s["la"] : undefined,
    page: Number(s["page"]) > 1 ? Math.floor(Number(s["page"])) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(institutionsQuery({ kind: "school", ...deps })),
      context.queryClient.ensureQueryData(educationSummaryQuery()),
    ]);
  },
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/education/schools" }],
  }),
  component: SchoolsPage,
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function SchoolsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/education/schools/" });
  const { data } = useSuspenseQuery(institutionsQuery({ kind: "school", ...search }));
  const { data: summary } = useSuspenseQuery(educationSummaryQuery());
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);
  const set = (patch: Partial<S>) => navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });
  const pages = Math.max(1, Math.ceil(data.total / data.size));

  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Find a school</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D}</p>
        <EduNav />
        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]" onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || undefined }); }}>
          <label className="sr-only" htmlFor="edu-q">School name, town or postcode</label>
          <Input id="edu-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="School name, town or postcode" />
          <label className="sr-only" htmlFor="edu-phase">Phase</label>
          <select id="edu-phase" className="h-10 rounded-md border border-night-line bg-night-panel px-3 text-sm" value={search.phase ?? ""} onChange={(e) => set({ phase: e.target.value || undefined })}>
            <option value="">All phases</option>
            {PHASES.map((p) => <option key={p} value={p}>{p === "Not applicable" ? "Other (no phase)" : p}</option>)}
          </select>
          <label className="sr-only" htmlFor="edu-la">Local authority</label>
          <select id="edu-la" className="h-10 max-w-xs rounded-md border border-night-line bg-night-panel px-3 text-sm" value={search.la ?? ""} onChange={(e) => set({ la: e.target.value || undefined })}>
            <option value="">All local authorities</option>
            {(summary?.gias?.las ?? []).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <Button type="submit">Search</Button>
        </form>

        {data.error ? <p role="alert" className="mt-6 text-sm">{data.error}</p> : (
          <>
            <p className="mt-6 text-sm text-night-muted" role="status">{data.total ? `About ${fmtNum(data.total)} schools` : "No schools match"}{search.q ? ` for “${search.q}”` : ""}.</p>
            <ul className="mt-3 divide-y divide-night-line rounded-md border border-night-line">
              {data.rows.map((r) => (
                <li key={r.id} className="p-4">
                  <Link to="/education/schools/$urn" params={{ urn: r.id.replace(/^urn:/, "") }} className="text-lg font-semibold text-electric-soft underline-offset-2 hover:underline">{r.name}</Link>
                  <p className="text-sm text-night-muted">{[r.phase, r.type, r.town, r.postcode].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 text-sm"><OfstedSummaryLine o={r.ofsted} />{r.pupils != null && <span className="text-night-muted"> · {fmtNum(r.pupils)} pupils</span>}</p>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Pages" className="mt-4 flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => navigate({ search: (p) => ({ ...p, page: data.page - 1 > 1 ? data.page - 1 : undefined }) })}>Previous</Button>
                <span className="text-sm text-night-muted">Page {data.page} of {fmtNum(pages)}</span>
                <Button variant="outline" size="sm" disabled={data.page >= pages} onClick={() => navigate({ search: (p) => ({ ...p, page: data.page + 1 }) })}>Next</Button>
              </nav>
            )}
          </>
        )}
        <SourceNote>School details: <a className="underline" href={EDU_SOURCES.gias.url} target="_blank" rel="noreferrer">{EDU_SOURCES.gias.name}</a>{summary?.gias ? `, ${summary.gias.date}` : ""}. Inspections: Ofsted management information{summary?.ofsted ? `, as at ${summary.ofsted.asAt}` : ""}. Independent schools are inspected by Ofsted or other bodies and may not appear on Ofsted's state-funded list.</SourceNote>
      </main>
      <SiteFooter />
    </div>
  );
}
