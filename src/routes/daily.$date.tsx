import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Download, ExternalLink, FileText, Printer } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getDailyBriefing } from "@/lib/daily.functions";
import { briefingCsv, briefingSummary, briefingText, longDate } from "@/lib/daily";
import { btn } from "@/lib/ui";

export const Route = createFileRoute("/daily/$date")({
  loader: async ({ params }) => {
    const res = await getDailyBriefing({ data: { date: params.date } });
    if (!res.briefing) throw notFound();
    return res;
  },
  head: ({ params, loaderData }) => {
    const url = `https://ukstats.co.uk/daily/${params.date}`;
    const title = loaderData?.briefing?.headline ?? `UK statistics statement — ${params.date}`;
    const desc = loaderData?.briefing
      ? briefingSummary(loaderData.briefing)
      : "The UK's published figures for this day, in words, with links to every official release.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: () => (
    <Shell>
      <p className="text-night-muted">This statement could not be loaded. Please try again.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <h1 className="text-2xl font-semibold">No statement for this day</h1>
      <p className="mt-2 text-night-muted">
        The record only covers days the register was running. Nothing is written after the fact.
      </p>
      <Link to="/daily" className={btn("primary", "md", "mt-4")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the archive
      </Link>
    </Shell>
  ),
  component: DailyBriefingPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">{children}</main>
      <SiteFooter />
    </div>
  );
}

function DailyBriefingPage() {
  const { briefing, prev, next } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  if (!briefing) return null;

  const path = `/daily/${briefing.date}`;
  const sources = Array.from(new Map(briefing.figures.map((f) => [f.sourceUrl, f.source])).entries());

  function copy() {
    void navigator.clipboard
      .writeText(briefingText(briefing!, `https://ukstats.co.uk${path}`))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
  }

  function csv() {
    const url = URL.createObjectURL(new Blob([briefingCsv(briefing!)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ukstats-${briefing!.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <nav className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/daily" className={btn("ghost", "sm")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          All statements
        </Link>
        <div className="flex gap-2">
          {prev ? (
            <Link to="/daily/$date" params={{ date: prev }} className={btn("secondary", "sm")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {longDate(prev)}
            </Link>
          ) : null}
          {next ? (
            <Link to="/daily/$date" params={{ date: next }} className={btn("secondary", "sm")}>
              {longDate(next)}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </nav>

      <header className="mt-5 border-b border-night-line/60 pb-5">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-electric">
          <FileText className="size-3.5" aria-hidden="true" />
          Daily statement
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{briefing.headline}</h1>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={copy} className={btn("secondary", "sm")}>
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy as text"}
          </button>
          <button type="button" onClick={csv} className={btn("secondary", "sm")}>
            <Download className="size-4" aria-hidden="true" />
            CSV
          </button>
          <button type="button" onClick={() => window.print()} className={btn("secondary", "sm")}>
            <Printer className="size-4" aria-hidden="true" />
            Print
          </button>
        </div>
        <ShareRow path={path} title={briefing.headline} className="mt-3 print:hidden" />
      </header>

      <article className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-night-fg/90">
        {briefing.body}
      </article>

      <section className="mt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">The figures behind it</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-night-line/60">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead className="bg-night-panel/50 font-mono text-[10px] uppercase tracking-[0.14em] text-night-muted">
              <tr>
                <th className="px-3 py-2">Figure</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Published by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-line/50">
              {briefing.figures.map((f) => (
                <tr key={`${f.role}-${f.metricId}`}>
                  <td className="px-3 py-2">
                    <span className="block text-night-fg">{f.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-night-muted">
                      {f.role === "changed" ? "Published this day" : "Standing figure"} · {f.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-night-fg">
                    {f.value}
                    {f.previousValue ? (
                      <span className="block text-[10px] text-night-muted">was {f.previousValue}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-night-muted">{f.period ?? "—"}</td>
                  <td className="px-3 py-2">
                    <a
                      href={f.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-electric-soft hover:underline"
                    >
                      {f.source}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Official sources</h2>
        <ul className="mt-2 grid gap-1 text-[13px]">
          {sources.map(([url, name]) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-electric-soft hover:underline"
              >
                {name}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
