import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { leaderboardQuery } from "@/lib/games.functions";

const MEDAL = ["text-[oklch(0.82_0.15_85)]", "text-[oklch(0.8_0.01_250)]", "text-[oklch(0.65_0.12_50)]"];

export function Leaderboard() {
  const [period, setPeriod] = useState<"day" | "week" | "all">("day");
  const { data, isLoading } = useQuery(leaderboardQuery(period));
  return (
    <section className="rounded-lg border border-night-line bg-night-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Daily 5 leaderboard</h2>
        <div className="flex gap-1">{(["day", "week", "all"] as const).map((p) => <Button key={p} size="sm" variant={p === period ? "default" : "outline"} onClick={() => setPeriod(p)}>{p === "day" ? "Today" : p === "week" ? "This week" : "All time"}</Button>)}</div>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-night-muted">Loading…</p>
        : data?.error ? <p className="mt-4 text-sm">{data.error}</p>
        : !data?.rows.length ? <p className="mt-4 text-sm text-night-muted">No scores yet — be the first on the board.</p>
        : (
          <ol className="mt-4 divide-y divide-night-line">
            {data.rows.map((r: { player: string; total: number; games: number }, i: number) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className={`w-6 font-mono font-semibold ${MEDAL[i] ?? "text-night-muted"}`}>{i + 1}</span>
                <span className="flex-1 truncate">{r.player}</span>
                <span className="font-mono text-xs text-night-muted">{r.games} played</span>
                <span className="w-16 text-right font-mono font-semibold">{r.total}</span>
              </li>
            ))}
          </ol>
        )}
      <p className="mt-3 text-xs text-night-muted">Real players only. Scores are checked on our server. Names come from your account's display name.</p>
    </section>
  );
}
