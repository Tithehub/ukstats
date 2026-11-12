import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users } from "lucide-react";
import { getSignupStats } from "@/lib/agents.functions";
import { fmtDate } from "@/lib/uk-stats";

export function SignupStatsCard() {
  const fetchStats = useServerFn(getSignupStats);
  const q = useQuery({ queryKey: ["signup-stats"], queryFn: () => fetchStats() });
  if (q.isError) return <p className="mb-6 text-overdue">Couldn't load sign-ups.</p>;
  const d = q.data;
  const max = d ? Math.max(1, ...d.series.map((s) => s.count)) : 1;
  return (
    <section className="mb-8 rounded-xl border border-night-border p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-electric" aria-hidden /> Sign-ups</h2>
      {!d ? <p className="mt-3 text-night-muted">Loading…</p> : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Total", d.total], ["Last 24 hours", d.day], ["Last 7 days", d.week], ["Last 30 days", d.month]].map(([l, v]) => (
              <div key={l as string}><dt className="font-mono text-[11px] uppercase tracking-wider text-night-muted">{l}</dt><dd className="text-2xl font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-5 flex h-16 items-end gap-[3px]" aria-label="Sign-ups per day, last 30 days">
            {d.series.map((s) => (
              <div key={s.day} title={`${s.day}: ${s.count}`} className="flex-1 rounded-sm bg-electric" style={{ height: `${Math.max(4, (s.count / max) * 100)}%`, opacity: s.count ? 1 : 0.2 }} />
            ))}
          </div>
          {d.first ? <p className="mt-3 font-mono text-[12px] text-night-muted">First sign-up {fmtDate(d.first)} · last 30 days, London time</p> : null}
        </>
      )}
    </section>
  );
}
