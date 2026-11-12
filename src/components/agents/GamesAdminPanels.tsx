import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gamepad2, Trophy } from "lucide-react";
import { getGamesAdminStats } from "@/lib/agents.functions";

type Ranked = { player: string; total: number; plays: number };
const nice = (g: string) => g.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Board({ title, rows, note }: { title: string; rows: Ranked[]; note?: string }) {
  return (
    <div className="rounded-xl border border-night-line bg-night-panel p-4">
      <h3 className="font-semibold">{title}</h3>
      {note ? <p className="font-mono text-[11px] uppercase text-night-muted">{note}</p> : null}
      <ol className="mt-2 space-y-1 text-[14px]">
        {rows.map((r, i) => <li key={r.player + i} className="flex justify-between gap-2"><span>{i + 1}. {r.player}</span><span className="font-mono">{r.total}</span></li>)}
        {!rows.length ? <li className="text-night-muted">No plays this week.</li> : null}
      </ol>
    </div>
  );
}

export function GamesAdminPanels() {
  const fetchStats = useServerFn(getGamesAdminStats);
  const q = useQuery({ queryKey: ["games-admin"], queryFn: () => fetchStats() });
  if (q.isError) return <p className="mt-10 text-overdue">Couldn't load games data.</p>;
  const d = q.data;
  return (
    <>
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Gamepad2 className="h-5 w-5 text-electric" aria-hidden /> Games</h2>
        {!d ? <p className="mt-3 text-night-muted">Loading…</p> : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-night-line">
            <table className="w-full text-[14px]">
              <thead className="font-mono text-[11px] uppercase text-night-muted"><tr><th className="p-2 text-left">Game</th><th className="p-2 text-right">Today</th><th className="p-2 text-right">7 days</th><th className="p-2 text-right">All time</th></tr></thead>
              <tbody>
                {d.stats.map((s) => (
                  <tr key={s.game} className="border-t border-night-line">
                    <td className="p-2">{nice(s.game)}</td>
                    {[s.today, s.week, s.all].map((x, i) => <td key={i} className="p-2 text-right font-mono">{x.plays} plays · {x.players} players</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Trophy className="h-5 w-5 text-electric" aria-hidden /> Games leaderboard</h2>
        <p className="mt-1 text-[14px] text-night-muted">Top 10 nicknames since {d?.weekStart ?? "…"} (last 7 London days).</p>
        {d ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Board title="Overall (quiz games)" rows={d.overall} />
            {d.quizBoards.map((b) => <Board key={b.game} title={nice(b.game)} rows={b.top} />)}
            {d.arcadeBoards.map((b) => <Board key={b.difficulty} title={`Aim High, Vote Lowe — ${b.difficulty}`} note="Best run · unchecked" rows={b.top} />)}
          </div>
        ) : null}
      </section>
    </>
  );
}
