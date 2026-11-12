import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell } from "@/components/games/GameShell";
import { QuestionCard } from "@/components/games/QuestionCard";
import { ShareResult } from "@/components/games/ShareResult";
import { worldQuery } from "@/lib/world.functions";
import { makeRound, shareBlocks, type Question } from "@/lib/games";

const META: Record<string, { title: string; kind: Question["kind"]; blurb: string }> = {
  "higher-or-lower": { title: "Higher or Lower", kind: "hl", blurb: "Two countries, one figure. Pick the higher one." },
  "guess-the-number": { title: "Guess the Number", kind: "guess", blurb: "Estimate a real figure — the closer, the more points." },
  "rank-the-world": { title: "Rank the World", kind: "rank", blurb: "Put five countries in order, highest first." },
};
const ROUND = 10;

export const Route = createFileRoute("/games/$game")({
  loader: ({ params, context }) => { if (!META[params.game]) throw notFound(); return context.queryClient.ensureQueryData(worldQuery()); },
  head: ({ params }) => {
    const m = META[params.game]; const t = `${m?.title ?? "Game"} — free stats game | UKStats`; const d = m?.blurb ?? "Free statistics game.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: Practice,
  notFoundComponent: () => <GameShell><p className="mt-6">That game doesn't exist.</p></GameShell>,
});

function Practice() {
  const { game } = Route.useParams();
  const m = META[game]!;
  const { data } = useSuspenseQuery(worldQuery());
  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => setSeed(String(Date.now())), []);
  const qs = useMemo(() => (data && seed ? makeRound(data, Array(ROUND).fill(m.kind), `${game}-${seed}`) : []), [data, seed, game, m.kind]);
  const [i, setI] = useState(0); const [pts, setPts] = useState<number[]>([]);
  const [best, setBest] = useState(0);
  useEffect(() => setBest(Number(localStorage.getItem(`game-best-${game}`) ?? 0)), [game]);
  const total = pts.reduce((a, b) => a + b, 0);
  const finished = qs.length > 0 && i >= qs.length;
  useEffect(() => { if (finished && total > best) { localStorage.setItem(`game-best-${game}`, String(total)); setBest(total); } }, [finished, total, best, game]);
  const restart = () => { setSeed(String(Date.now())); setI(0); setPts([]); };

  return (
    <GameShell>
      <h1 className="mt-4 text-3xl font-semibold">{m.title}</h1>
      <p className="mt-1 text-night-muted">{m.blurb} {ROUND} questions · personal best {best}</p>
      {!data ? <p className="mt-6">World figures are unavailable right now — please try again shortly.</p>
        : !seed || !qs.length ? <p className="mt-6">Loading…</p>
        : finished ? (
          <div className="mt-6 space-y-4 rounded-lg border border-night-line bg-night-panel p-6">
            <p className="text-2xl font-semibold">{total} / {qs.length * 100}</p>
            <p className="text-2xl">{shareBlocks(pts)}</p>
            <ShareResult text={`I scored ${total}/${qs.length * 100} on UKStats ${m.title} ${shareBlocks(pts)} — can you beat me?`} url={`https://ukstats.co.uk/games/${game}`} />
            <Button variant="outline" onClick={restart}>Play again</Button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="mb-2 font-mono text-sm text-night-muted">Question {i + 1} of {qs.length} · {total} points</p>
            <QuestionCard key={`${seed}-${i}`} q={qs[i]!} onDone={(_a, p) => { setPts((x) => [...x, p]); setI((n) => n + 1); }} />
          </div>
        )}
    </GameShell>
  );
}
