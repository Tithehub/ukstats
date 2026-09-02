import { ageLabel, dueLabel, fmtDate, freshnessOf, type AlertTone, type Freshness, type Metric } from "@/lib/uk-stats";

const freshDot: Record<Freshness, string> = {
  fresh: "bg-fresh",
  ageing: "bg-ageing",
  overdue: "bg-overdue",
  unknown: "bg-night-muted",
};

const freshWord: Record<Freshness, string> = {
  fresh: "Fresh",
  ageing: "Ageing",
  overdue: "Overdue",
  unknown: "No date",
};

const toneStroke: Record<AlertTone, string> = {
  neutral: "var(--night-muted)",
  green: "var(--alert-green)",
  yellow: "var(--alert-yellow)",
  amber: "var(--alert-amber)",
  red: "var(--alert-red)",
  crimson: "var(--alert-crimson)",
};

export function FreshnessPip({ metric }: { metric: Metric }) {
  const f = freshnessOf(metric);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-night-muted">
      <span className={`size-1.5 rounded-full ${freshDot[f]}`} />
      {freshWord[f]}
    </span>
  );
}

/** Inline sparkline drawn from the published series only. */
export function Sparkline({ points, className = "" }: { points: number[]; className?: string }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 100;
  const h = 28;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`h-7 w-full ${className}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--electric)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Headline indicator with source, period, freshness and next release. */
export function IndicatorCard({ metric }: { metric: Metric }) {
  const known = metric.status === "ok" && metric.value != null;
  return (
    <article className="rounded-xl border border-night-line/60 bg-night-panel/70 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold leading-tight text-night-fg text-balance">{metric.title}</h3>
        <FreshnessPip metric={metric} />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p
          className={`font-mono text-2xl font-semibold leading-none tracking-tight tabular-nums ${
            known ? "text-night-fg" : "text-night-muted"
          }`}
        >
          {known ? metric.value : (metric.emptyLabel ?? "Not published")}
        </p>
        {metric.change ? (
          <span className="mb-0.5 shrink-0 font-mono text-[11px] text-electric-soft">{metric.change.label}</span>
        ) : null}
      </div>

      {metric.spark?.length > 1 ? <Sparkline points={metric.spark} className="mt-3" /> : <div className="mt-3 h-7" />}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-night-line/50 pt-3 font-mono text-[10px] text-night-muted">
        <div className="col-span-2 truncate">
          <dt className="sr-only">Source</dt>
          <dd className="truncate">
            <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-electric-soft">
              {metric.source}
            </a>
          </dd>
        </div>
        <div className="truncate">
          <dt className="sr-only">Period</dt>
          <dd className="truncate">{metric.period ?? "—"}</dd>
        </div>
        <div className="truncate text-right">
          <dt className="sr-only">Age</dt>
          <dd>{ageLabel(metric.asOf)}</dd>
        </div>
        <div className="truncate">
          <dt className="sr-only">Published</dt>
          <dd>pub {fmtDate(metric.asOf)}</dd>
        </div>
        <div className="truncate text-right">
          <dt className="sr-only">Next release</dt>
          <dd>{dueLabel(metric.nextDue)}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Arc dial reproducing the issuing body's own published scale. */
export function AlertDial({ metric }: { metric: Metric }) {
  const scale = metric.scale;
  if (!scale) return null;
  const steps = scale.steps;
  const current = scale.current;
  const known = metric.status === "ok" && current != null;

  const cx = 60;
  const cy = 54;
  const r = 42;
  const gap = 4; // degrees between segments
  const total = 180;
  const each = (total - gap * (steps.length - 1)) / steps.length;

  const arc = (startDeg: number, endDeg: number) => {
    const p = (deg: number) => {
      const rad = (Math.PI * (180 - deg)) / 180;
      return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
    };
    const [x1, y1] = p(startDeg);
    const [x2, y2] = p(endDeg);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  };

  return (
    <article className="rounded-xl border border-night-line/60 bg-night-panel/70 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold leading-tight text-night-fg text-balance">{metric.title}</h3>
        <FreshnessPip metric={metric} />
      </div>

      <div className="mt-2 flex items-center gap-4">
        <svg viewBox="0 0 120 62" className="h-[62px] w-[120px] shrink-0" aria-hidden="true">
          {steps.map((s, i) => {
            const start = i * (each + gap);
            const active = known && i === current;
            const passed = known && current != null && i < current;
            return (
              <path
                key={s.label}
                d={arc(start, start + each)}
                fill="none"
                strokeWidth={active ? 10 : 7}
                strokeLinecap="butt"
                stroke={active || passed ? toneStroke[s.tone] : "var(--night-line)"}
                opacity={active ? 1 : passed ? 0.4 : 1}
              />
            );
          })}
        </svg>
        <div className="min-w-0">
          <p className="truncate font-mono text-lg font-semibold leading-tight text-night-fg">
            {known ? (metric.value ?? steps[current]!.label) : "Not published"}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-night-muted">
            {known ? `step ${current! + 1} of ${steps.length}` : "level not readable"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex justify-between border-t border-night-line/50 pt-2 font-mono text-[9px] text-night-muted">
        <span className="truncate">{scale.authority}</span>
        <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 hover:text-electric-soft">
          Official page
        </a>
      </div>
    </article>
  );
}

/** Collapsible category container: summary row that already answers the question. */
export function CategoryPanel({
  title,
  blurb,
  metrics,
  defaultOpen = false,
}: {
  title: string;
  blurb: string;
  metrics: Metric[];
  defaultOpen?: boolean;
}) {
  if (!metrics.length) return null;
  const lead = metrics.find((m) => m.status === "ok" && m.value) ?? metrics[0]!;
  const live = metrics.filter((m) => m.status === "ok").length;

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-night-line/60 bg-night-panel/40 open:bg-night-panel/70"
    >
      <summary className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-night-panel/80 sm:flex sm:justify-between [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="truncate text-sm font-semibold text-night-fg">{title}</h3>
          <span className="hidden shrink-0 font-mono text-[10px] text-night-muted sm:inline">
            {live} of {metrics.length} live
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="font-mono text-sm text-night-fg tabular-nums">{lead.value ?? "Not published"}</p>
            <p className="font-mono text-[9px] text-night-muted">{lead.title}</p>
          </div>
          <div className="hidden w-24 md:block">
            <Sparkline points={lead.spark ?? []} />
          </div>
          <FreshnessPip metric={lead} />
          <svg
            viewBox="0 0 24 24"
            className="size-4 text-night-muted transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>

      <div className="border-t border-night-line/50 p-4">
        <p className="mb-4 font-mono text-[11px] text-night-muted">{blurb}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((m) => (
            <IndicatorCard key={m.id} metric={m} />
          ))}
        </div>
      </div>
    </details>
  );
}
