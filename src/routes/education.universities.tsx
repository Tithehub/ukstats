import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageLoading, PageNotFound } from "@/components/layout/PageFeedback";
import { ShareRow } from "@/components/ShareRow";
import { EduNav, fmtNum, SourceNote } from "@/components/education/EduShared";
import { institutionsQuery } from "@/lib/education.functions";
import { EDU_SOURCES, NO_FEED_LINKS } from "@/lib/education";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface S { q?: string | undefined; page?: number | undefined }
const T = "Universities and registered higher-education providers in England | UK Stats";
const D = "Every provider on the Office for Students Register: registration category, degree-awarding powers, university title, TEF status and any fines, straight from the official register.";

export const Route = createFileRoute("/education/universities")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 80) : undefined,
    page: Number(s["page"]) > 1 ? Math.floor(Number(s["page"])) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(institutionsQuery({ kind: "provider", ...deps })),
  head: () => ({
    meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/education/universities" }],
  }),
  component: UniPage,
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function UniPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/education/universities" });
  const { data } = useSuspenseQuery(institutionsQuery({ kind: "provider", ...search }));
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);
  const pages = Math.max(1, Math.ceil(data.total / data.size));
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">Universities and higher education</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D}</p>
        <ShareRow className="mt-4" path="/education/universities" title="Every registered university and HE provider in England" sourceUrl={EDU_SOURCES.ofs.url} sourceLabel="OfS Register" />
        <EduNav />
        <form className="mt-6 flex gap-3" onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: q.trim() || undefined } }); }}>
          <label className="sr-only" htmlFor="uni-q">Provider name or postcode</label>
          <Input id="uni-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="University or college name" />
          <Button type="submit">Search</Button>
        </form>
        {data.error ? <p role="alert" className="mt-6 text-sm">{data.error}</p> : (
          <>
            <p className="mt-6 text-sm text-night-muted" role="status">{fmtNum(data.total)} registered providers{search.q ? ` matching “${search.q}”` : ""}.</p>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {data.rows.map((r) => {
                const p = r.provider;
                return (
                  <li key={r.id} className="rounded-md border border-night-line bg-night-panel p-4">
                    <h2 className="font-semibold">{r.name}</h2>
                    {p && p.legalName !== r.name && <p className="text-xs text-night-muted">{p.legalName}</p>}
                    <dl className="mt-2 space-y-1 text-sm">
                      <div><dt className="inline text-night-muted">Category: </dt><dd className="inline">{p?.category ?? "—"}</dd></div>
                      <div><dt className="inline text-night-muted">Degree powers: </dt><dd className="inline">{p?.degreePowers ?? "None"}</dd></div>
                      <div><dt className="inline text-night-muted">"University" title: </dt><dd className="inline">{p?.universityTitle ?? "—"}</dd></div>
                      <div><dt className="inline text-night-muted">TEF: </dt><dd className="inline">{p?.tef ?? "Not published"}</dd></div>
                      {p && p.penalties.length > 0 && <div><dt className="inline text-night-muted">OfS fines: </dt><dd className="inline">{p.penalties.map((x, i) => <span key={i}>{x.amount != null ? `£${fmtNum(x.amount)}` : "Amount not stated"}{x.link && <> (<a className="underline" href={x.link} target="_blank" rel="noreferrer">case report</a>)</>}{i < p.penalties.length - 1 ? "; " : ""}</span>)}</dd></div>}
                    </dl>
                    {r.provider && <p className="mt-2 font-mono text-[11px] text-night-muted">UKPRN {r.id.replace("ukprn:", "")}{r.postcode ? ` · ${r.postcode}` : ""}</p>}
                  </li>
                );
              })}
            </ul>
            {pages > 1 && (
              <nav aria-label="Pages" className="mt-4 flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => navigate({ search: (p) => ({ ...p, page: data.page - 1 > 1 ? data.page - 1 : undefined }) })}>Previous</Button>
                <span className="text-sm text-night-muted">Page {data.page} of {pages}</span>
                <Button variant="outline" size="sm" disabled={data.page >= pages} onClick={() => navigate({ search: (p) => ({ ...p, page: data.page + 1 }) })}>Next</Button>
              </nav>
            )}
          </>
        )}
        <SourceNote>Source: <a className="underline" href={EDU_SOURCES.ofs.url} target="_blank" rel="noreferrer">{EDU_SOURCES.ofs.name}</a>, downloaded daily. TEF ratings in detail: <a className="underline" href="https://tef2023.officeforstudents.org.uk/" target="_blank" rel="noreferrer">TEF 2023 outcomes</a>. Student numbers, continuation and graduate outcomes aren't pulled yet — see{" "}
          {NO_FEED_LINKS.filter((l) => l.nation === "UK universities").map((l, i) => <span key={l.url}>{i ? " and " : ""}<a className="underline" href={l.url} target="_blank" rel="noreferrer">{l.label.split(" — ")[0]}</a></span>)}. Scottish, Welsh and Northern Irish universities are regulated separately and aren't on this register.</SourceNote>
      </main>
      <SiteFooter />
    </div>
  );
}
