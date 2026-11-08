import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GLOSSARY, GLOSSARY_GROUPS, SCALE, findTerm, searchGlossary } from "@/lib/politics-glossary";

const TITLE = "Politics Explained — political terms & abbreviations | UKStats";
const DESC = "Plain-English, neutral definitions of political terms and abbreviations: the left–right scale, civic and ethnic nationalism, far-right, centre-left, MP, PMQs and more.";

export const Route = createFileRoute("/politics-explained")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; group?: string | undefined; term?: string | undefined } => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 80) : undefined,
    group: typeof s["group"] === "string" && s["group"] ? s["group"] : undefined,
    term: typeof s["term"] === "string" && s["term"] ? s["term"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { property: "og:url", content: "https://ukstats.co.uk/politics-explained" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/politics-explained" }],
  }),
  component: Page,
});

function Page() {
  const { q = "", group, term } = Route.useSearch();
  const navigate = useNavigate({ from: "/politics-explained" });
  const list = searchGlossary(q, group);
  const selected = term ? findTerm(term) : undefined;
  const set = (p: { q?: string | undefined; group?: string | undefined; term?: string | undefined }) => navigate({ search: (s) => ({ ...s, ...p }), replace: true });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Politics Explained</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{GLOSSARY.length} political terms and abbreviations in plain English, from the left–right scale to civic nationalism and PMQs.</p>
        <p className="mt-3 rounded border border-border bg-muted/40 p-3 text-sm">For education only. Definitions describe how terms are commonly used, not judgements about any person or group. Each links to a dictionary or official reference.</p>

        <section aria-label="Political scale" className="mt-8">
          <h2 className="text-xl font-semibold">The political scale</h2>
          <div className="mt-3 grid grid-cols-3 gap-1 sm:grid-cols-9">
            {SCALE.map((s) => {
              const on = term === s.slug;
              const tone = s.pos < 0 ? "bg-destructive" : s.pos > 0 ? "bg-primary" : "bg-muted-foreground";
              return (
                <button key={s.slug} onClick={() => set({ term: on ? undefined : s.slug })} aria-pressed={on}
                  className={`min-h-14 rounded px-1 text-xs font-semibold text-primary-foreground ${tone} ${on ? "ring-4 ring-ring" : ""}`}
                  style={{ opacity: 0.45 + Math.abs(s.pos) * 0.14 }}>{s.label}</button>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>← Left</span><span>Right →</span></div>
          {selected && (
            <div className="mt-4 rounded border border-border p-4">
              <h3 className="text-lg font-semibold">{selected.term}{selected.aka && <span className="ml-2 text-sm font-normal text-muted-foreground">({selected.aka})</span>}</h3>
              <p className="mt-1">{selected.short}</p>
              {selected.detail && <p className="mt-2 text-sm text-muted-foreground">{selected.detail}</p>}
              {selected.scale !== undefined && (
                <p className="mt-2 text-sm">Related terms at this position: {GLOSSARY.filter((t) => t.scale === selected.scale && t.slug !== selected.slug).map((t) => t.term).join(", ") || "none"}</p>
              )}
              <a className="mt-2 inline-flex items-center gap-1 text-sm underline" href={selected.source.url} target="_blank" rel="noopener noreferrer">{selected.source.label}<ExternalLink className="size-3" /></a>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-64 flex-1 items-center gap-2 rounded border border-border px-3">
              <Search className="size-4" aria-hidden />
              <input value={q} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search e.g. Civ-Nat, PMQs" className="h-11 w-full bg-transparent outline-none" />
            </label>
            <select value={group ?? ""} onChange={(e) => set({ group: e.target.value || undefined })} className="h-11 rounded border border-border bg-background px-2">
              <option value="">All categories</option>
              {GLOSSARY_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{list.length} terms</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {list.map((t) => (
              <div key={t.slug} id={t.slug} className="rounded border border-border p-4">
                <dt className="font-semibold">{t.term}{t.aka && <span className="ml-2 text-sm font-normal text-muted-foreground">{t.aka}</span>}</dt>
                <dd className="mt-1 text-sm">{t.short}</dd>
                {t.detail && <dd className="mt-1 text-sm text-muted-foreground">{t.detail}</dd>}
                <dd className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded bg-muted px-2 py-0.5">{t.group}</span>
                  <a className="inline-flex items-center gap-1 underline" href={t.source.url} target="_blank" rel="noopener noreferrer">{t.source.label}<ExternalLink className="size-3" /></a>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
