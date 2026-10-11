import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileSearch,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { ageLabel, dueLabel, fmtDate, freshnessOf, type Freshness, type Metric } from "@/lib/uk-stats";
import { categoryIcon } from "@/lib/ui";

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
const freshLabel: Record<Freshness, string> = {
  fresh: "Fresh",
  ageing: "Ageing",
  overdue: "Overdue",
  unknown: "No feed",
};
const freshIcon: Record<Freshness, LucideIcon> = {
  fresh: Check,
  ageing: Clock,
  overdue: AlertTriangle,
  unknown: CircleHelp,
};


function Spark({ values, tone }: { values: number[]; tone: Freshness }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {values.slice(-8).map((v, i, arr) => (
        <span
          key={i}
          className={`w-1.5 ${i === arr.length - 1 ? `${freshBg[tone]} opacity-70` : "bg-steel/30"}`}
          style={{ height: `${20 + ((v - min) / span) * 80}%` }}
        />
      ))}
    </div>
  );
}

function Breakdown({ parts }: { parts: NonNullable<Metric["breakdown"]> }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  if (!total) return null;
  return (
    <div className="mt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        {parts.map((p) => (
          <span
            key={p.label}
            className={p.highlight ? "bg-brand" : "bg-steel/35"}
            style={{ width: `${(p.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-steel/70">
        {parts.map((p) => (
          <li key={p.label} className={p.highlight ? "text-ink" : undefined}>
            <span className={`mr-1 inline-block size-1.5 rounded-full align-middle ${p.highlight ? "bg-brand" : "bg-steel/35"}`} />
            {p.label} {p.value.toLocaleString("en-GB")} · {((p.value / total) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MetricCard({ metric, origin }: { metric: Metric; origin: string }) {
  const [panel, setPanel] = useState<"none" | "embed" | "provenance">("none");
  const [copied, setCopied] = useState(false);
  const tone = freshnessOf(metric);
  const snippet = `<iframe src="${origin}/embed/${metric.id}" width="360" height="220" style="border:0" title="${metric.title}" loading="lazy"></iframe>`;

  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-card/60 p-4 ring-1 ring-ink/10 backdrop-blur-sm">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-steel/60">
            {(() => {
              const Icon = categoryIcon(metric.category);
              return <Icon className="size-3.5 shrink-0" aria-hidden="true" />;
            })()}
            {metric.category}
          </p>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight text-balance">{metric.title}</h3>

          {metric.derivedFrom ? (
            <span className="mt-1 inline-block rounded bg-ageing/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ageing">
              Derived
            </span>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md bg-ink/5 px-2 py-1 font-mono text-[10px] text-steel">
          {metric.source.split(" · ")[0]}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="leading-none">
          {metric.value ? (
            <span className="font-mono text-[2.1rem] font-semibold tracking-tighter tabular-nums">{metric.value}</span>
          ) : (
            <span className="font-mono text-[1.35rem] font-semibold tracking-tight text-steel/70">
              {metric.emptyLabel ?? (metric.status === "no-feed" ? "No live feed" : "Unavailable")}
            </span>
          )}
          <p className="mt-1 font-mono text-[11px] text-steel/70">
            {metric.period ?? metric.sub}
            {metric.change ? (
              <>
                {" · "}
                <span className={metric.change.dir === "up" ? "text-ageing" : metric.change.dir === "down" ? "text-fresh" : "text-steel"}>
                  {metric.change.label}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <Spark values={metric.spark} tone={tone} />
      </div>

      {metric.breakdown?.length ? <Breakdown parts={metric.breakdown} /> : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[11px]">
        <span className={`inline-flex items-center gap-1.5 ${freshText[tone]}`}>
          {(() => {
            const Icon = freshIcon[tone];
            return <Icon className="size-3.5 shrink-0" aria-hidden="true" />;
          })()}
          <span className={`size-1.5 rounded-full ${freshBg[tone]} ${tone === "fresh" ? "pulse-dot" : ""}`} />
          {freshLabel[tone]} · as of {fmtDate(metric.asOf)}
        </span>
        <span className={tone === "overdue" ? "text-overdue/80" : "text-steel/60"}>{dueLabel(metric.nextDue)}</span>
      </div>

      <p className="mt-1 font-mono text-[10px] text-steel/50">
        {ageLabel(metric.asOf)} · {metric.cadence}
      </p>
      {metric.covers || metric.unknownFrom ? (
        <div className="mt-2 rounded-md bg-ink/[0.04] px-2 py-1.5 font-mono text-[10px] leading-relaxed text-steel/70">
          {metric.covers ? <p>Covers: {metric.covers}</p> : null}
          {metric.unknownFrom ? (
            <p className="text-overdue/80">
              Unknown from {fmtDate(metric.unknownFrom)} · published {fmtDate(metric.asOf)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
        <button
          type="button"
          onClick={() => setPanel(panel === "embed" ? "none" : "embed")}
          aria-expanded={panel === "embed"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-ground transition-colors hover:bg-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Code2 className="size-4" aria-hidden="true" />
          Embed
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "provenance" ? "none" : "provenance")}
          aria-expanded={panel === "provenance"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium text-steel transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <FileSearch className="size-4" aria-hidden="true" />
          Provenance
        </button>
        {metric.hasHistory ? (
          <Link
            to="/history/$metricId"
            params={{ metricId: metric.id }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium text-steel transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <LineChart className="size-4" aria-hidden="true" />
            Full history
          </Link>
        ) : null}
        <Link
          to="/explained/$metricId"
          params={{ metricId: metric.id }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium text-steel transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <CircleHelp className="size-4" aria-hidden="true" />
          Explained
        </Link>
        <code className="ml-auto hidden font-mono text-[10px] text-steel/50 lg:block">{metric.id}</code>
      </div>


      {panel === "embed" ? (
        <div className="mt-3 rounded-md bg-ink p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand">Paste anywhere</p>
          <code className="mt-2 block break-all font-mono text-[10px] leading-relaxed text-ground/80">{snippet}</code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md bg-ground/15 px-3 py-2 font-mono text-[11px] text-ground hover:bg-ground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Code copied" : "Copy code"}
          </button>

        </div>
      ) : null}

      {panel === "provenance" ? (
        <div className="mt-3 rounded-md bg-ink/5 p-3 font-mono text-[11px] text-steel">
          <p>
            <span className="text-steel/60">Issuing body:</span> {metric.source}
          </p>
          <p className="mt-1">
            <span className="text-steel/60">Reference period:</span> {metric.period ?? "—"}
          </p>
          <p className="mt-1">
            <span className="text-steel/60">Next scheduled release:</span>{" "}
            {metric.nextDue ? fmtDate(metric.nextDue) : "not announced by the publisher"}
          </p>
          {metric.note ? <p className="mt-2 text-pretty text-steel/80">{metric.note}</p> : null}
          <a
            href={metric.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 underline decoration-brand underline-offset-2"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open the source
          </a>
        </div>
      ) : null}
    </article>
  );
}

