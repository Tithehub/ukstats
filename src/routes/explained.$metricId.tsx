import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Download, ExternalLink, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { MetricCard } from "@/components/MetricCard";
import { explainerById, type Explainer } from "@/lib/explained";
import { getMetricHistory, getUkStats } from "@/lib/uk-stats.functions";
import { computeChanges } from "@/lib/changes";
import type { Metric } from "@/lib/uk-stats";

function genericExplainer(m: Metric): Explainer {
  const sections = [
    {
      heading: "What it measures",
      body: `${m.title}${m.sub ? ` — ${m.sub}` : ""}. The figure is published by ${m.source}${m.period ? ` and covers ${m.period}` : ""}.`,
    },
    {
      heading: "How often it is published",
      body: `${m.source} publishes this ${m.cadence.toLowerCase()}. UKStats shows the figure exactly as published and never estimates values between releases.`,
    },
  ];
  if (m.note) sections.push({ heading: "Publisher notes", body: m.note });
  if (m.derivedFrom) sections.push({ heading: "How UKStats derives it", body: m.derivedFrom });
  return {
    id: m.id,
    title: `${m.title}: the official figure explained`,
    summary: `The latest ${m.title.toLowerCase()} figure from ${m.source}, with its period, release dates and full source link.`,
    sections,
    methodology: { label: `${m.source} — original publication`, url: m.sourceUrl },
  };
}

export const Route = createFileRoute("/explained/$metricId")({
  loader: async ({ params }) => {
    const stats = await getUkStats();
    const metric = stats.metrics.find((m) => m.id === params.metricId) ?? null;
    const written = explainerById(params.metricId);
    if (!written && !metric) throw notFound();
    const explainer = written ?? genericExplainer(metric!);
    let changes: ReturnType<typeof computeChanges> = [];
    let unit = "";
    if (metric?.hasHistory) {
      try {
        const h = await getMetricHistory({ data: { id: metric.id } });
        if (h) {
          changes = computeChanges(h.points);
          unit = h.unit;
        }
      } catch {
        /* history unavailable — section hidden */
      }
    }
    return { explainer, metric, changes, unit };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.explainer.title ?? "Explained";
    const desc = loaderData?.explainer.summary ?? "A plain-English explainer of an official UK statistic.";
    return {
      meta: [
        { title: `${title} | UKStats` },
        { name: "description", content: desc },
        { property: "og:title", content: `${title} — UKStats` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://ukstats.co.uk/explained/${params.metricId}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://ukstats.co.uk/explained/${params.metricId}` }],
    };
  },
  component: ExplainedPage,
  notFoundComponent: () => (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">No explainer for that figure yet</h1>
        <p className="mt-2 text-night-muted">
          Browse the <Link to="/register" className="text-electric-soft underline">full register</Link> instead.
        </p>
      </main>
      <SiteFooter />
    </div>
  ),
});

function fmt(n: number) {
  const abs = Math.abs(n);
  return n.toLocaleString("en-GB", { maximumFractionDigits: abs < 10 ? 2 : abs < 1000 ? 1 : 0 });
}

function CopyBox({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">{label}</p>
      <div className="mt-2 flex items-start gap-2">
        <code className="block flex-1 overflow-x-auto rounded border border-night-line/70 bg-night p-3 text-[12px]">{text}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-night-line/70 hover:border-electric"
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {done ? <Check className="h-4 w-4 text-electric" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function downloadCardPng(id: string) {
  const host = document.getElementById("metric-card-capture");
  const svg = host?.querySelector("svg");
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const rect = svg.getBoundingClientRect();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, rect.width * 2);
    c.height = Math.max(1, rect.height * 2);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const a = document.createElement("a");
    a.download = `ukstats-${id}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

function ExplainedPage() {
  const { explainer, metric, changes, unit } = Route.useLoaderData();
  const origin = typeof window === "undefined" ? "https://ukstats.co.uk" : window.location.origin;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const citation = metric
    ? `${metric.source}, "${metric.title}"${metric.period ? `, ${metric.period}` : ""}. Via UKStats (ukstats.co.uk/explained/${metric.id}), accessed ${today}. Original: ${metric.sourceUrl}`
    : "";
  const embed = metric
    ? `<iframe src="https://ukstats.co.uk/embed/${metric.id}" width="360" height="220" style="border:0" title="${metric.title}" loading="lazy"></iframe>`
    : "";

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
        <Link to="/register" className="inline-flex items-center gap-1.5 font-mono text-[12px] text-night-muted hover:text-electric-soft">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Full register
        </Link>

        <p className="mt-4 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">
          <BookOpen className="h-3.5 w-3.5 text-electric" aria-hidden /> Explained
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{explainer.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-night-muted">{explainer.summary}</p>

        {metric ? (
          <div className="mt-8">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">The live figure</p>
            <div id="metric-card-capture" className="mt-2 max-w-sm">
              <MetricCard metric={metric} origin={origin} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {metric.hasHistory ? (
                <Link to="/history/$metricId" params={{ metricId: metric.id }} className="inline-flex items-center gap-1.5 text-[13px] text-electric-soft hover:underline">
                  See every published observation <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
              {metric.spark.length > 1 ? (
                <button type="button" onClick={() => downloadCardPng(metric.id)} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-electric-soft hover:underline">
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download chart (PNG)
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {changes.length ? (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-electric" aria-hidden /> What changed
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {changes.map((c) => (
                <div key={c.label} className="rounded-lg border border-night-line/70 bg-night-panel p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-night-muted">{c.label}</p>
                  <p className="mt-1 text-xl font-semibold">
                    {c.diff > 0 ? "+" : ""}{fmt(c.diff)}{unit === "%" ? " pts" : unit ? ` ${unit}` : ""}
                  </p>
                  {c.pct !== null && unit !== "%" ? (
                    <p className="text-[13px] text-night-muted">{c.pct > 0 ? "+" : ""}{c.pct.toFixed(1)}%</p>
                  ) : null}
                  <p className="mt-1 text-[12px] text-night-muted">vs {c.fromLabel}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-night-muted">Worked out from published values only. Missing comparisons mean that period was not published.</p>
          </section>
        ) : null}

        <article className="mt-10 space-y-8">
          {explainer.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-night-muted">{s.body}</p>
            </section>
          ))}
        </article>

        <div className="mt-10 rounded-lg border border-night-line/70 bg-night-panel p-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">Methodology</p>
          <a href={explainer.methodology.url} className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-electric-soft underline" rel="noreferrer" target="_blank">
            {explainer.methodology.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <p className="mt-2 text-[13px] text-night-muted">
            UKStats reproduces the published figure exactly; the publisher's own methodology notes are the authoritative description of how it is compiled.
          </p>
        </div>

        {metric ? (
          <div className="mt-10 space-y-5 rounded-lg border border-night-line/70 bg-night-panel p-5">
            <CopyBox label="Cite this figure" text={citation} />
            <CopyBox label="Embed this figure" text={embed} />
          </div>
        ) : null}

        <div className="mt-10">
          <ShareRow title={explainer.title} path={`/explained/${explainer.id}`} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
