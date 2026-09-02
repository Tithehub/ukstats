import { createFileRoute, notFound } from "@tanstack/react-router";
import { getUkStats } from "@/lib/uk-stats.functions";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type Freshness } from "@/lib/uk-stats";

export const Route = createFileRoute("/embed/$metric")({
  loader: async ({ params }) => {
    const data = await getUkStats();
    const metric = data.metrics.find((m) => m.id === params.metric);
    if (!metric) throw notFound();
    return { metric };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.metric.title} — UK National Data Register` : "Widget unavailable" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.metric.title} from ${loaderData.metric.source}, with data age and next release date.`
          : "This statistics widget is unavailable.",
      },
      { property: "og:title", content: loaderData?.metric.title ?? "UK National Data Register widget" },
      {
        property: "og:description",
        content: "Embeddable UK official statistic with source, data age and next update date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmbedWidget,
});

const freshText: Record<Freshness, string> = {
  fresh: "text-fresh",
  ageing: "text-ageing",
  overdue: "text-overdue",
  unknown: "text-steel/60",
};
const freshBg: Record<Freshness, string> = {
  fresh: "bg-fresh",
  ageing: "bg-ageing",
  overdue: "bg-overdue",
  unknown: "bg-steel/40",
};

function EmbedWidget() {
  const { metric } = Route.useLoaderData();
  const tone = freshnessOf(metric);

  return (
    <div className="min-h-screen bg-ground p-3 font-sans text-ink">
      <article className="relative overflow-hidden rounded-[14px] bg-card/70 p-4 ring-1 ring-ink/10">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel/60">{metric.category}</p>
            <h1 className="mt-0.5 text-[15px] font-semibold tracking-tight text-balance">{metric.title}</h1>
          </div>
          <span className="shrink-0 rounded-md bg-ink/5 px-2 py-1 font-mono text-[10px] text-steel">
            {metric.source.split(" · ")[0]}
          </span>
        </div>
        <p className="mt-3 font-mono text-[2rem] font-semibold leading-none tracking-tighter tabular-nums">
          {metric.value ?? (metric.status === "no-feed" ? "No live feed" : "Unavailable")}
        </p>
        <p className="mt-1 font-mono text-[11px] text-steel/70">{metric.period ?? metric.sub}</p>
        <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-2 font-mono text-[10px]">
          <span className={`inline-flex items-center gap-1.5 ${freshText[tone]}`}>
            <span className={`size-1.5 rounded-full ${freshBg[tone]}`} />
            as of {fmtDate(metric.asOf)} · {ageLabel(metric.asOf)}
          </span>
          <span className="text-steel/60">{dueLabel(metric.nextDue)}</span>
        </div>
        <a
          href={metric.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block font-mono text-[10px] text-steel/50 underline decoration-brand underline-offset-2"
        >
          {metric.source}
        </a>
      </article>
    </div>
  );
}
