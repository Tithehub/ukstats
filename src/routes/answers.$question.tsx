import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MetricCard } from "@/components/MetricCard";
import { PageLoading, PageLoadError } from "@/components/layout/PageFeedback";
import { ANSWER_TOPICS } from "@/lib/answer-topics";
import { getUkStats } from "@/lib/uk-stats.functions";
import { fmtDate, ageLabel } from "@/lib/uk-stats";

const statsQuery = queryOptions({ queryKey: ["uk-stats"], queryFn: () => getUkStats(), staleTime: 5 * 60_000 });
export const Route = createFileRoute("/answers/$question")({
  loader: async ({ params, context }) => {
    const topic = ANSWER_TOPICS.find(item => item.slug === params.question);
    if (!topic) throw notFound();
    const data = await context.queryClient.ensureQueryData(statsQuery);
    return { topic, metric: data.metrics.find(metric => metric.id === topic.metricId) ?? null, now: Date.now() };
  },
  pendingComponent: PageLoading, errorComponent: PageLoadError,
  head: ({ loaderData, params }) => {
    const title = `${loaderData?.topic.title ?? "Official UK answer"} — UKStats`;
    const description = `The latest published official figure, reference period, publication date and limitations for ${loaderData?.topic.title ?? "this UK statistic"}`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" }], links: [{ rel: "canonical", href: `https://ukstats.co.uk/answers/${params.question}` }] };
  },
  component: AnswerPage,
});
function AnswerPage() {
  const { topic, metric, now } = Route.useLoaderData();
  return <div className="min-h-dvh bg-night text-night-fg"><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-10">
    <Link to="/register" className="text-sm text-electric-soft underline">← UK data register</Link>
    <h1 className="mt-4 text-3xl font-semibold">{topic.title}</h1>
    <p className="mt-5 text-xl leading-relaxed">{metric?.status === "ok" && metric.value ? <>{metric.source} reports <strong>{metric.value}</strong> for <strong>{metric.period ?? "the stated reference period"}</strong>.</> : "No verified figure is available from the connected source right now. No value is assumed."}</p>
    {metric ? <>
      <p className="mt-3 text-sm text-night-muted">Published: {metric.asOf ? fmtDate(metric.asOf) : "not stated"} · Data age: {metric.asOf ? ageLabel(metric.asOf, now) : "unknown"} · Next release: {metric.nextDue ? fmtDate(metric.nextDue) : "no date confirmed"}</p>
      <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-electric-soft underline">{metric.source} — original publication</a>
      <div className="mt-8 max-w-sm"><MetricCard metric={metric} origin="https://ukstats.co.uk" /></div>
      {metric.hasHistory ? <Link to="/history/$metricId" params={{ metricId: metric.id }} className="mt-4 inline-block text-electric-soft underline">Every published observation →</Link> : null}
    </> : <p className="mt-3 text-night-muted">The register retains official source links when the source can be identified.</p>}
    <section className="mt-8 border-t border-night-line pt-6"><h2 className="text-xl font-semibold">What this figure means</h2><p className="mt-3 text-night-muted">{topic.limitation}</p>{metric?.note ? <p className="mt-3 text-sm text-night-muted">{metric.note}</p> : null}</section>
    <nav aria-label="More official answers" className="mt-10 border-t border-night-line pt-6"><h2 className="font-semibold">More official answers</h2><ul className="mt-3 space-y-3">{ANSWER_TOPICS.filter(item => item.slug !== topic.slug).map(item => <li key={item.slug}><Link to="/answers/$question" params={{ question: item.slug }} className="text-electric-soft underline">{item.title}</Link></li>)}</ul></nav>
  </main><SiteFooter /></div>;
}