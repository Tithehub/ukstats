import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTIES, LEVELS, type Difficulty } from "@/lib/lowes-mission";

type Row = { player: string; best: number; runs: number };
const RANGES = [["today", "Today"], ["week", "This week"], ["all", "All time"]] as const;

function since(r: (typeof RANGES)[number][0]) {
  if (r === "all") return null;
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/London" }));
  if (r === "week") d.setDate(d.getDate() - 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ArcadeLeaderboard({ refresh = 0 }: { refresh?: number }) {
  const [level, setLevel] = useState<Difficulty>("normal");
  const [range, setRange] = useState<(typeof RANGES)[number][0]>("week");
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let live = true; setRows(null);
    supabase.rpc("arcade_leaderboard", { _game: "aim-high-vote-lowe", _difficulty: level, _since: since(range) as string, max_rows: 20 })
      .then(({ data }) => { if (live) setRows((data ?? []) as Row[]); });
    return () => { live = false; };
  }, [level, range, refresh]);
  const btn = (on: boolean) => `rounded-md px-3 py-1 text-sm ${on ? "bg-primary text-primary-foreground" : "border border-night-line"}`;
  return (
    <section className="rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="text-lg font-semibold">Aim High, Vote Lowe leaderboard</h2>
      <p className="text-xs text-night-muted">Arcade scores — not checked like quiz scores, and not part of the Overall board.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => <button key={d} className={btn(level === d)} onClick={() => setLevel(d)}>{LEVELS[d].label}</button>)}
        <span className="mx-1" />
        {RANGES.map(([k, l]) => <button key={k} className={btn(range === k)} onClick={() => setRange(k)}>{l}</button>)}
      </div>
      {rows === null ? <p className="mt-3 text-sm text-night-muted">Loading…</p> : rows.length === 0 ? <p className="mt-3 text-sm text-night-muted">No scores yet — be the first.</p> : (
        <ol className="mt-3 divide-y divide-night-line text-sm">
          {rows.map((r, i) => <li key={i} className="flex justify-between py-1.5"><span>{i + 1}. {r.player}</span><span className="font-mono">{r.best}</span></li>)}
        </ol>
      )}
    </section>
  );
}
