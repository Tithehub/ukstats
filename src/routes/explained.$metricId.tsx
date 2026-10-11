import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { MetricCard } from "@/components/MetricCard";
import { explainerById } from "@/lib/explained";
import { getUkStats } from "@/lib/uk-stats.functions";

export const Route = createFileRoute("/explained/$metricId")({
  loader: async ({ params }) => {
    const explainer = explainerById(params.metricId);
    if (!explainer) throw notFound();
    const stats = await getUkStats();
    const metric = stats.metrics.find((m) => m.id === explainer.id) ?? null;
    return { explainer, metric };
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

function ExplainedPage() {
  const { explainer, metric } = Route.useLoaderData();
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-night-muted hover:text-electric-soft"
        >
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
            <div className="mt-2 max-w-sm">
              <MetricCard metric={metric} origin={origin} />
            </div>
            {metric.hasHistory ? (
              <Link
                to="/history/$metricId"
                params={{ metricId: metric.id }}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-electric-soft hover:underline"
              >
                See every published observation <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : null}
          </div>
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
          <a
            href={explainer.methodology.url}
            className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-electric-soft underline"
            rel="noreferrer"
            target="_blank"
          >
            {explainer.methodology.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <p className="mt-2 text-[13px] text-night-muted">
            UKStats reproduces the published figure exactly; the publisher's own methodology notes are the
            authoritative description of how it is compiled.
          </p>
        </div>

        <div className="mt-10">
          <ShareRow title={explainer.title} path={`/explained/${explainer.id}`} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
