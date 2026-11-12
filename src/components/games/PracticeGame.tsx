import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/games/QuestionCard";
import { ShareResult } from "@/components/games/ShareResult";
import { Leaderboard } from "@/components/games/Leaderboard";
import { submitScore } from "@/lib/games.functions";
import { shareBlocks, type Answer, type GameId, type Question } from "@/lib/games";
import { useAuth } from "@/lib/useAuth";

/** A replayable 10-question round. Signed-in players' rounds are scored and saved automatically. */
export function PracticeGame({ game, title, blurb, build, unavailable }: { game: GameId; title: string; blurb: string; build: (seed: string) => Question[]; unavailable: boolean }) {
  const { session } = useAuth();
  const qc = useQueryClient(); const submit = useServerFn(submitScore);
  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => setSeed(String(Date.now())), []);
  const qs = useMemo(() => (seed && !unavailable ? build(seed) : []), [seed, build, unavailable]);
  const [i, setI] = useState(0); const [pts, setPts] = useState<number[]>([]); const [answers, setAnswers] = useState<Answer[]>([]);
  const [best, setBest] = useState(0); const [saved, setSaved] = useState("");
  useEffect(() => setBest(Number(localStorage.getItem(`game-best-${game}`) ?? 0)), [game]);
  const total = pts.reduce((a, b) => a + b, 0);
  const finished = qs.length > 0 && i >= qs.length;

  useEffect(() => {
    if (!finished || !seed) return;
    if (total > best) { localStorage.setItem(`game-best-${game}`, String(total)); setBest(total); }
    if (!session) return;
    setSaved("Saving…");
    submit({ data: { game, seed, answers } })
      .then(async (r) => { setSaved(r.ok ? (r.best > r.score ? `Saved — today's best is still ${r.best}.` : `Saved — ${r.score} is today's best on the board.`) : r.error); await qc.invalidateQueries({ queryKey: ["game-leaderboard"] }); })
      .catch(() => setSaved("Couldn't save your score."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);
  const restart = () => { setSeed(String(Date.now())); setI(0); setPts([]); setAnswers([]); setSaved(""); };

  return (
    <>
      <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-night-muted">{blurb} · personal best {best}</p>
      <div className="mt-6">
        {unavailable ? <p>These figures are unavailable right now — please try again shortly.</p>
          : !qs.length ? <p>Loading…</p>
          : finished ? (
            <div className="space-y-4 rounded-lg border border-night-line bg-night-panel p-6">
              <p className="text-2xl font-semibold">{total} / {qs.length * 100}</p>
              <p className="text-2xl">{shareBlocks(pts)}</p>
              {session ? <p role="status">{saved}</p> : <p><Link to="/auth" className="text-electric-soft underline">Sign in free</Link> to put your rounds on the leaderboard.</p>}
              <ShareResult text={`I scored ${total}/${qs.length * 100} on UKStats ${title} ${shareBlocks(pts)} — can you beat me?`} url={`https://ukstats.co.uk/games/${game}`} />
              <Button variant="outline" onClick={restart}>Play again</Button>
            </div>
          ) : (
            <>
              <p className="mb-2 font-mono text-sm text-night-muted">Question {i + 1} of {qs.length} · {total} points</p>
              <QuestionCard key={`${seed}-${i}`} q={qs[i]!} onDone={(a, p) => { setAnswers((x) => [...x, a]); setPts((x) => [...x, p]); setI((n) => n + 1); }} />
            </>
          )}
      </div>
      <div className="mt-8"><Leaderboard game={game} /></div>
    </>
  );
}
