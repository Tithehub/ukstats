import { ageLabel, fmtDate, type AlertTone, type Metric } from "@/lib/uk-stats";
import { ClockText } from "@/components/ClockText";

const toneBg: Record<AlertTone, string> = {
  neutral: "bg-steel/25",
  green: "bg-alert-green",
  yellow: "bg-alert-yellow",
  amber: "bg-alert-amber",
  red: "bg-alert-red",
  crimson: "bg-alert-crimson",
};
const toneText: Record<AlertTone, string> = {
  neutral: "text-steel",
  green: "text-alert-green",
  yellow: "text-alert-amber",
  amber: "text-alert-amber",
  red: "text-alert-red",
  crimson: "text-alert-crimson",
};

/** True for metrics that publish a status on an official scale. */
export function isStatusMetric(m: Metric): boolean {
  return Boolean(m.scale);
}

export function ThreatTile({ metric, compact = false }: { metric: Metric; compact?: boolean }) {
  const scale = metric.scale;
  if (!scale) return null;
  const current = scale.current;
  const tone: AlertTone = current == null ? "neutral" : scale.steps[current]!.tone;
  const known = metric.status === "ok" && current != null;

  return (
    <article className="relative overflow-hidden rounded-[14px] bg-card/70 p-4 ring-1 ring-ink/10">
      <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${toneBg[tone]}`} />
      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold leading-tight tracking-tight text-balance">{metric.title}</h3>
          <span className="shrink-0 rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-steel">
            {metric.source.split(" · ")[0]}
          </span>
        </div>

        <p className={`mt-2 font-mono text-[1.35rem] font-semibold leading-none tracking-tight ${toneText[tone]}`}>
          {known ? metric.value : "Not published"}
        </p>

        <div className="mt-3 flex gap-[3px]" aria-hidden="true">
          {scale.steps.map((s, i) => {
            const active = known && i === current;
            const passed = known && current != null && i < current;
            return (
              <span
                key={s.label}
                className={`h-2 flex-1 rounded-[2px] ${
                  active ? toneBg[s.tone] : passed ? `${toneBg[s.tone]} opacity-35` : "bg-steel/12"
                }`}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-steel/50">
          <span>{scale.steps[0]!.label}</span>
          <span>{scale.steps[scale.steps.length - 1]!.label}</span>
        </div>

        {compact ? null : (
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-steel/70">{metric.sub}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/10 pt-2 font-mono text-[9px] text-steel/60">
          <span>{scale.authority}</span>
          <span>{metric.asOf ? <>set {fmtDate(metric.asOf)} · <ClockText>{ageLabel(metric.asOf)}</ClockText></> : "no date published"}</span>
          <a
            href={metric.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto underline decoration-brand underline-offset-2"
          >
            Official page
          </a>
        </div>
      </div>
    </article>
  );
}

export function ThreatBoard({ metrics, compact = false }: { metrics: Metric[]; compact?: boolean }) {
  const tiles = metrics.filter(isStatusMetric);
  if (!tiles.length) return null;
  return (
    <section aria-label="Official UK alert and threat levels">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">National alert and threat levels</h2>
        <p className="font-mono text-[10px] text-steel/60">
          Each level is shown on the issuing body's own published scale — no composite score, no assumed default.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((m) => (
          <ThreatTile key={m.id} metric={m} compact={compact} />
        ))}
      </div>
    </section>
  );
}
