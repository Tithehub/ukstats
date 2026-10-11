import type { CountryMetric } from "@/lib/countries";
import { ageLabel, fmtDate } from "@/lib/uk-stats";

export function CountryCard({ m }: { m: CountryMetric }) {
  const max = Math.max(...m.spark), min = Math.min(...m.spark);
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-night-line bg-night-panel p-4">
      <h3 className="text-sm font-medium text-night-muted">{m.title}</h3>
      {m.value ? (
        <p className="font-mono text-3xl font-semibold text-night-fg">{m.value}</p>
      ) : (
        <p className="font-mono text-lg text-night-muted">No figure published</p>
      )}
      {m.spark.length > 1 && (
        <svg viewBox={`0 0 ${m.spark.length - 1} 20`} className="h-8 w-full text-electric" preserveAspectRatio="none" aria-hidden="true">
          <polyline fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
            points={m.spark.map((v, i) => `${i},${max === min ? 10 : 20 - ((v - min) / (max - min)) * 20}`).join(" ")} />
        </svg>
      )}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-night-muted">
        <dt>Period</dt><dd className="text-night-fg">{m.period ?? "—"}</dd>
        <dt>Updated</dt><dd className="text-night-fg">{m.asOf ? `${fmtDate(m.asOf)} · ${ageLabel(m.asOf)}` : "—"}</dd>
        <dt>Cadence</dt><dd className="text-night-fg">{m.cadence}</dd>
        <dt>Next release</dt><dd className="text-night-fg">{m.next ?? "Per Eurostat release calendar"}</dd>
      </dl>
      {m.note && <p className="text-xs text-night-muted">{m.note}</p>}
      <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-auto text-xs text-electric-soft underline">Source: {m.source}</a>
    </article>
  );
}
