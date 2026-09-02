import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type Freshness, type Metric } from "@/lib/uk-stats";
import { ThreatTile, isStatusMetric } from "@/components/ThreatBoard";

interface EmbedSearch {
  ids?: string | undefined;
  theme?: "light" | "dark";
  density?: "compact" | "full";
  provenance?: boolean;
}

export const Route = createFileRoute("/embed/$metric")({
  validateSearch: (raw: Record<string, unknown>): EmbedSearch => ({
    ids: typeof raw["ids"] === "string" ? raw["ids"] : undefined,
    theme: raw["theme"] === "dark" ? "dark" : "light",
    density: raw["density"] === "compact" ? "compact" : "full",
    provenance: raw["provenance"] === false || raw["provenance"] === "false" ? false : true,
  }),
  loaderDeps: ({ search }) => ({ ids: search.ids }),
  loader: async ({ params, deps }) => {
    const data = await getUkStats();
    const wanted = [
      ...(params.metric === "board" || params.metric === "multi" ? [] : [params.metric]),
      ...(deps.ids ? deps.ids.split(",").map((s) => s.trim()).filter(Boolean) : []),
    ];
    let metrics: Metric[];
    if (params.metric === "board") {
      metrics = data.metrics.filter(isStatusMetric);
    } else {
      metrics = wanted
        .map((id) => data.metrics.find((m) => m.id === id))
        .filter((m): m is Metric => Boolean(m));
    }
    if (!metrics.length) throw notFound();
    return { metrics, fetchedAt: data.fetchedAt, board: params.metric === "board" };
  },
  head: ({ loaderData }) => {
    const first = loaderData?.metrics[0];
    const title = loaderData?.board
      ? "UK alert and threat levels — live widget"
      : first
        ? `${first.title} — UK National Data Register`
        : "Widget unavailable";
    return {
      meta: [
        { title },
        { name: "robots", content: "noindex" },
        {
          name: "description",
          content: first
            ? `${first.title} from ${first.source}, with data age and next release date.`
            : "This statistics widget is unavailable.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Embeddable UK official statistics with source, data age and next update date.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
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

function Row({ metric, compact, provenance }: { metric: Metric; compact: boolean; provenance: boolean }) {
  const tone = freshnessOf(metric);
  return (
    <article className="relative overflow-hidden rounded-[14px] bg-card/70 p-4 ring-1 ring-ink/10">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel/60">{metric.category}</p>
          <h2 className="mt-0.5 text-[14px] font-semibold tracking-tight text-balance">{metric.title}</h2>
        </div>
        <span className="shrink-0 rounded-md bg-ink/5 px-2 py-1 font-mono text-[10px] text-steel">
          {metric.source.split(" · ")[0]}
        </span>
      </div>
      <p
        className={`mt-3 font-mono font-semibold leading-none tracking-tighter tabular-nums ${
          compact ? "text-[1.5rem]" : "text-[2rem]"
        }`}
      >
        {metric.value ?? (metric.status === "no-feed" ? "No live feed" : "Unavailable")}
      </p>
      {compact ? null : <p className="mt-1 font-mono text-[11px] text-steel/70">{metric.period ?? metric.sub}</p>}
      {provenance ? (
        <>
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
        </>
      ) : null}
    </article>
  );
}

function EmbedWidget() {
  const { metrics, fetchedAt, board } = Route.useLoaderData();
  const search = Route.useSearch();
  const compact = search.density === "compact";
  const provenance = search.provenance !== false;

  // Keep the widget live: reload the embedded page periodically.
  useEffect(() => {
    const t = setInterval(() => window.location.reload(), 15 * 60_000);
    return () => clearInterval(t);
  }, []);

  // Report height to the host page so it can size the iframe.
  useEffect(() => {
    const post = () =>
      window.parent?.postMessage(
        { type: "ndr-widget-height", height: document.documentElement.scrollHeight },
        "*",
      );
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`${search.theme === "dark" ? "theme-dark dark" : "theme-light"} min-h-screen bg-ground p-3 font-sans text-ink`}>
      <h1 className="sr-only">
        {board
          ? "UK alert and threat levels — live widget"
          : `${metrics.map((m) => m.title).join(", ")} — live UK statistics widget`}
      </h1>
      <div className={`grid gap-3 ${metrics.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {metrics.map((m) =>
          board || isStatusMetric(m) ? (
            <ThreatTile key={m.id} metric={m} compact={compact} />
          ) : (
            <Row key={m.id} metric={m} compact={compact} provenance={provenance} />
          ),
        )}
      </div>
      <p className="mt-2 text-center font-mono text-[9px] text-steel/50">
        Live from official UK sources · pulled {new Date(fetchedAt).toLocaleTimeString("en-GB")} ·{" "}
        <a href="/" target="_blank" rel="noreferrer" className="underline decoration-brand underline-offset-2">
          UK National Data Register
        </a>
      </p>
    </div>
  );
}
