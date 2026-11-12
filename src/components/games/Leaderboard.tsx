import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { leaderboardQuery, myPlayer, setPlayerName } from "@/lib/games.functions";
import { GAME_DEFS, type GameId } from "@/lib/games";
import { useAuth } from "@/lib/useAuth";

const MEDAL = ["text-[oklch(0.82_0.15_85)]", "text-[oklch(0.8_0.01_250)]", "text-[oklch(0.65_0.12_50)]"];
type Row = { player: string; total: number; games: number; best: number };

/** Live leaderboard for any game; `choose` shows a game picker. Signed-in players can set their board name. */
export function Leaderboard({ game: initial = "daily-5", choose = false }: { game?: GameId; choose?: boolean }) {
  const [game, setGame] = useState<GameId>(initial);
  const [period, setPeriod] = useState<"day" | "week" | "all">("day");
  const { data, isLoading } = useQuery(leaderboardQuery(game, period));
  const daily = game === "daily-5";
  return (
    <section className="rounded-lg border border-night-line bg-night-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{GAME_DEFS[game].title} leaderboard</h2>
        <div className="flex gap-1">{(["day", "week", "all"] as const).map((p) => <Button key={p} size="sm" variant={p === period ? "default" : "outline"} onClick={() => setPeriod(p)}>{p === "day" ? "Today" : p === "week" ? "This week" : "All time"}</Button>)}</div>
      </div>
      {choose && (
        <div className="mt-3 flex flex-wrap gap-1">
          {(Object.keys(GAME_DEFS) as GameId[]).map((g) => <Button key={g} size="sm" variant={g === game ? "secondary" : "ghost"} onClick={() => setGame(g)}>{GAME_DEFS[g].title}</Button>)}
        </div>
      )}
      {isLoading ? <p className="mt-4 text-sm text-night-muted">Loading…</p>
        : data?.error ? <p className="mt-4 text-sm">{data.error}</p>
        : !data?.rows.length ? <p className="mt-4 text-sm text-night-muted">No scores yet — be the first on the board.</p>
        : (
          <ol className="mt-4 divide-y divide-night-line">
            <li className="flex gap-3 pb-1 font-mono text-[11px] uppercase tracking-wider text-night-muted"><span className="w-6">#</span><span className="flex-1">Player</span><span>{daily ? "Played" : "Days"}</span><span className="w-14 text-right">Best</span><span className="w-16 text-right">Points</span></li>
            {data.rows.map((r: Row, i: number) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className={`w-6 font-mono font-semibold ${MEDAL[i] ?? "text-night-muted"}`}>{i + 1}</span>
                <span className="flex-1 truncate">{r.player}</span>
                <span className="font-mono text-xs text-night-muted">{r.games}</span>
                <span className="w-14 text-right font-mono text-xs text-night-muted">{r.best}</span>
                <span className="w-16 text-right font-mono font-semibold">{r.total}</span>
              </li>
            ))}
          </ol>
        )}
      <PlayerName />
      <p className="mt-3 text-xs text-night-muted">Real players only — scores are re-checked on our server. {daily ? "One go per day." : "Your best round each day counts."} Days reset at midnight UK time.</p>
    </section>
  );
}

function PlayerName() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const getMe = useServerFn(myPlayer); const save = useServerFn(setPlayerName);
  const me = useQuery({ queryKey: ["my-player", session?.user.id], queryFn: () => getMe(), enabled: !!session });
  const [name, setName] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { if (me.data) setName(me.data.name); }, [me.data]);
  if (!session) return <p className="mt-4 text-sm"><Link to="/auth" className="text-electric-soft underline">Sign in free</Link> to get your name on the board.</p>;
  return (
    <form className="mt-4 flex flex-wrap items-center gap-2" onSubmit={async (e) => {
      e.preventDefault(); setMsg("");
      try { const r = await save({ data: { name } }); setMsg(r.ok ? "Saved" : r.error); if (r.ok) await qc.invalidateQueries({ queryKey: ["game-leaderboard"] }); }
      catch { setMsg("Name must be 2–24 characters."); }
    }}>
      <label htmlFor="player-name" className="text-sm text-night-muted">Your board name</label>
      <input id="player-name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="w-44 rounded-md border border-night-line bg-night px-2 py-1 text-sm" />
      <Button size="sm" type="submit" variant="outline">Save name</Button>
      {msg && <span role="status" className="text-sm text-night-muted">{msg}</span>}
    </form>
  );
}
