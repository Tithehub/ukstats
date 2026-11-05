import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { UkTopicNav } from "@/components/UkTopicNav";
import { fmtDate } from "@/lib/uk-stats";
import { CHECKED, FIGURES, FINDINGS, LOCAL, NOT_PUBLISHED, RECOMMENDATIONS, STATUS, SUPPORT, TIMELINE, INDEPENDENT_WORKS, INDEPENDENT_CHECKED, type Source } from "@/lib/grooming-inquiry.data";
import { finalReportLabel, recommendationCounts, sortedTimeline } from "@/lib/grooming-inquiry";

const T = "Grooming gangs inquiry — official facts, timeline and figures | UK Stats";
const D = "The UK national grooming gangs inquiry: chair, powers, timeline, Casey audit findings, published figures and the 12 recommendations — every fact linked to its official source.";

export const Route = createFileRoute("/grooming-gangs-inquiry")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

function Src({ s }: { s: Source }) {
  return <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-xs text-electric-soft underline">Source: {s.publisher} — {s.title} · published {fmtDate(s.published)}</a>;
}

function Support() {
  return (
    <aside aria-label="Support" className="rounded-md border border-night-line bg-night-panel p-4">
      <h2 className="text-lg font-semibold">If you need help</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {SUPPORT.map((s) => <li key={s.name} className="text-sm"><a href={s.url} target="_blank" rel="noreferrer" className="font-semibold underline">{s.name}</a><span className="block text-night-muted">{s.detail}</span></li>)}
      </ul>
    </aside>
  );
}

function H({ id, children }: { id: string; children: string }) {
  return <h2 id={id} className="mt-12 scroll-mt-20 border-b border-night-line pb-2 text-2xl font-semibold tracking-tight">{children}</h2>;
}

function Page() {
  const counts = recommendationCounts();
  return (
    <div className="min-h-screen bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-night-muted">UK · Child protection · Official sources only</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Grooming gangs inquiry</h1>
        <p className="mt-2 max-w-3xl text-night-muted">{D}</p>
        <p className="mt-3 text-xs text-night-muted">Sources checked {fmtDate(CHECKED)}. No victims are named. Nothing here is estimated by UKStats — estimates shown are the reports' own, and are labelled.</p>
        <div className="mt-6"><Support /></div>
        <div className="mt-6"><UkTopicNav /></div>

        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-3 font-mono text-xs">
          {[["now", "Where things stand"], ["timeline", "Timeline"], ["findings", "Findings"], ["figures", "Figures"], ["local", "Local areas"], ["recs", "Recommendations"], ["sources", "Sources"], ["independent", "Independent inquiry and book"]].map(([id, l]) => <a key={id} href={`#${id}`} className="underline">{l}</a>)}
        </nav>

        <H id="now">Where things stand now</H>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[["Inquiry", STATUS.name], ["Legal basis", STATUS.basis], ["Covers", STATUS.coverage], ["Chair", STATUS.chair], ["Panel", STATUS.panel.join(", ")], ["Adviser", STATUS.adviser], ["Announced", fmtDate(STATUS.announced)], ["Final terms of reference", fmtDate(STATUS.termsFinal)], ["Length", STATUS.length], ["Funding", STATUS.funding], ["First local investigations", STATUS.firstAreas.join(", ")], ["Final report", finalReportLabel(STATUS.finalReport)]].map(([k, v]) => (
            <div key={k} className="rounded-md border border-night-line bg-night-panel p-3"><div className="font-mono text-xs text-night-muted">{k}</div><div className="mt-1 font-semibold">{v}</div></div>
          ))}
        </div>
        <div className="mt-2 flex flex-col">{STATUS.sources.map((s) => <Src key={s.url} s={s} />)}</div>

        <H id="timeline">Timeline</H>
        <ol className="mt-4 border-l border-night-line pl-5">
          {sortedTimeline(TIMELINE).map((e) => (
            <li key={e.title} className="mb-6">
              <div className="font-mono text-xs text-night-muted">{e.monthOnly ? new Date(e.date).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "Europe/London" }) : fmtDate(e.date)}</div>
              <h3 className="font-semibold">{e.title}</h3>
              <p className="text-sm text-night-muted">{e.detail}</p>
              <Src s={e.source} />
            </li>
          ))}
        </ol>

        <H id="findings">Key official findings</H>
        <div className="mt-4 grid gap-3">
          {FINDINGS.map((f) => (
            <blockquote key={f.quote} className="rounded-md border-l-4 border-primary bg-night-panel p-4">
              <p className="text-base">“{f.quote}”</p>
              <footer className="mt-1 text-xs text-night-muted">{f.report}</footer>
              <Src s={f.source} />
            </blockquote>
          ))}
        </div>

        <H id="figures">Published figures</H>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FIGURES.map((f) => (
            <article key={f.label} className="rounded-md border border-night-line bg-night-panel p-4">
              <div className="text-sm text-night-muted">{f.label}</div>
              <div className="mt-1 font-mono text-3xl font-semibold">{f.value}</div>
              <div className="font-mono text-xs text-night-muted">Period: {f.period} · Next release: none scheduled</div>
              <p className="mt-1 text-xs">{f.note}</p>
              <Src s={f.source} />
            </article>
          ))}
          {NOT_PUBLISHED.map((l) => (
            <article key={l} className="rounded-md border border-dashed border-night-line p-4">
              <div className="text-sm text-night-muted">{l}</div>
              <div className="mt-1 font-mono text-xl">Not published</div>
              <p className="mt-1 text-xs text-night-muted">No official national figure exists. The Casey audit found national data, including ethnicity data, too poor to give one.</p>
            </article>
          ))}
        </div>

        <H id="local">Local areas</H>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-xs text-night-muted"><tr><th className="py-2 pr-4">Area</th><th className="py-2 pr-4">Status</th><th className="py-2">Source</th></tr></thead>
            <tbody>{LOCAL.map((l) => <tr key={l.area} className="border-t border-night-line"><td className="py-2 pr-4 font-semibold">{l.area}</td><td className="py-2 pr-4">{l.status}</td><td className="py-2"><a href={l.url} target="_blank" rel="noreferrer" className="underline">Link</a></td></tr>)}</tbody>
          </table>
        </div>

        <H id="recs">Casey's 12 recommendations</H>
        <p className="mt-2 text-sm text-night-muted">Government position: {counts.accepted} accepted, {counts["in progress"]} under way. The Home Secretary wrote on 9 December 2025: “The Government is implementing every recommendation set out by Baroness Casey”.</p>
        <ol className="mt-4 grid gap-2">
          {RECOMMENDATIONS.map((r) => (
            <li key={r.n} className="flex gap-3 rounded-md border border-night-line bg-night-panel p-3 text-sm">
              <span className="font-mono font-semibold">{r.n}</span>
              <span className="flex-1">{r.text}</span>
              <span className="shrink-0 rounded border border-night-line px-2 py-0.5 font-mono text-xs">{r.position}</span>
            </li>
          ))}
        </ol>

        <H id="sources">Sources</H>
        <ul className="mt-4 grid gap-1">
          {[...new Map([...STATUS.sources, ...TIMELINE.map((t) => t.source)].map((s) => [s.url, s])).values()].map((s) => <li key={s.url}><Src s={s} /></li>)}
        </ul>
        <H id="independent">Other investigations and books</H>
        <p className="mt-3 text-sm text-night-muted">These are independent publications, not official sources. UKStats makes no money from these links and does not take figures from them. Links checked {fmtDate(INDEPENDENT_CHECKED)}.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {INDEPENDENT_WORKS.map((w) => (
            <div key={w.title} className="rounded-md border border-night-line bg-night-panel p-4">
              <div className="font-mono text-xs text-night-muted">{w.kind}</div>
              <div className="mt-1 text-lg font-semibold">{w.title}</div>
              <div className="text-sm text-night-muted">{w.by}</div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">{w.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold underline">{l.label}</a>)}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-night-muted">This page reports official documents only. It names no victims and no individuals beyond official reports, and avoids comment on live court cases.</p>
        <div className="mt-6"><Support /></div>
      </main>
      <SiteFooter />
    </div>
  );
}
