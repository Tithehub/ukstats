import { useQuery, queryOptions } from "@tanstack/react-query";
import { getUkStats } from "@/lib/uk-stats.functions";
import { taxWelfareQuery } from "@/lib/uk-page-queries";
import { stripItems } from "@/lib/game-stats-strip";
import type { StatsPayload } from "@/lib/uk-stats";

const statsQuery = queryOptions<StatsPayload>({ queryKey: ["uk-stats"], queryFn: () => getUkStats(), staleTime: 5 * 60_000 });

/** Live published figures in a strip outside the play area — never over the game. */
export function LiveStatsStrip({ compact = false, overlay = false, interactive = true }: { compact?: boolean; overlay?: boolean; interactive?: boolean }) {
  const s = useQuery(statsQuery);
  const tw = useQuery(taxWelfareQuery());
  const items = stripItems(s.data?.metrics ?? [], tw.data?.points ?? []);
  const row = (dup: boolean) => items.map((i) => (
    <a key={i.key + (dup ? "-b" : "")} href={i.href} aria-hidden={dup || undefined} tabIndex={dup || !interactive ? -1 : undefined} className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap px-4">
      <span className="font-semibold uppercase tracking-wide text-night-muted">{i.label}</span>
      <span className="font-mono font-semibold">{s.isPending ? "…" : i.value}</span>
      {i.note ? <span className="text-night-muted">({i.note})</span> : null}
    </a>
  ));
  return (
    <div className={overlay ? `game-stats-strip absolute inset-x-0 bottom-0 z-10 overflow-hidden bg-night/45 py-0.5 text-[10px] opacity-75 ${interactive ? "" : "pointer-events-none"}` : `game-stats-strip overflow-hidden border-night-line bg-night-panel text-[12px] ${compact ? "border-b py-1" : "mt-4 rounded-lg border py-1.5"}`} aria-label="Latest published UK figures">
      <div className="games-ribbon-track flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}
