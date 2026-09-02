import { Link } from "@tanstack/react-router";
import { ageLabel, dueLabel, type Metric } from "@/lib/uk-stats";

/** The figures pinned to the top of every page, in the publisher's own wording. */
export const VITAL_IDS = [
  "uk-national-debt",
  "uk-cpi",
  "uk-population",
  "uk-net-migration",
  "uk-unemployment",
  "uk-house-prices",
  "uk-irregular-arrivals-ytd",
  "uk-terror-threat",
];

export function VitalSigns({ metrics }: { metrics: Metric[] }) {
  const byId = new Map(metrics.map((m) => [m.id, m]));
  const vitals = VITAL_IDS.map((id) => byId.get(id)).filter(Boolean) as Metric[];
  const fallback = vitals.length
    ? vitals
    : metrics.filter((m) => m.status === "ok" && m.value).slice(0, 6);
  if (!fallback.length) return null;

  return (
    <section aria-label="Vital statistics" className="rounded-xl border border-night-line/60 bg-night-panel/60">
      <div className="flex items-center justify-between gap-3 border-b border-night-line/50 px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Vital signs</p>
        <p className="hidden font-mono text-[10px] text-night-muted sm:block">
          Pinned figures, each straight from its issuing body
        </p>
      </div>
      <ul className="grid grid-cols-2 divide-night-line/50 md:grid-cols-4 xl:grid-cols-8">
        {fallback.map((m) => {
          const body = (
            <>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-night-muted">{m.title}</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-night-fg">
                {m.value ?? m.emptyLabel ?? "Not published"}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-night-muted">
                {ageLabel(m.asOf)} · {dueLabel(m.nextDue)}
              </p>
            </>
          );
          return (
            <li key={m.id} className="border-b border-night-line/40 px-4 py-3 md:border-b-0 md:border-r last:md:border-r-0">
              {m.hasHistory ? (
                <Link
                  to="/history/$metricId"
                  params={{ metricId: m.id }}
                  className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
