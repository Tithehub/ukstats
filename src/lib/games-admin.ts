export type ScoreRow = { user_id: string; game: string; score: number; day: string; difficulty?: string };
export type Ranked = { player: string; total: number; plays: number };

/** Sum each player's scores and return the top `n`, ties by fewer plays then name. */
export function topPlayers(rows: ScoreRow[], names: Map<string, string>, n = 10): Ranked[] {
  const m = new Map<string, Ranked>();
  for (const r of rows) {
    const e = m.get(r.user_id) ?? { player: names.get(r.user_id) || "Anonymous player", total: 0, plays: 0 };
    e.total += r.score; e.plays++; m.set(r.user_id, e);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.plays - b.plays || a.player.localeCompare(b.player)).slice(0, n);
}

/** Best single score per player (arcade boards). */
export function bestPlayers(rows: ScoreRow[], names: Map<string, string>, n = 10): Ranked[] {
  const m = new Map<string, Ranked>();
  for (const r of rows) {
    const e = m.get(r.user_id) ?? { player: names.get(r.user_id) || "Anonymous player", total: 0, plays: 0 };
    e.total = Math.max(e.total, r.score); e.plays++; m.set(r.user_id, e);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || a.player.localeCompare(b.player)).slice(0, n);
}

export function playStats(rows: ScoreRow[], today: string, weekStart: string) {
  const sub = (f: (r: ScoreRow) => boolean) => { const s = rows.filter(f); return { plays: s.length, players: new Set(s.map((r) => r.user_id)).size }; };
  return { today: sub((r) => r.day === today), week: sub((r) => r.day >= weekStart), all: sub(() => true) };
}
