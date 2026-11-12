import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { GameShell } from "@/components/games/GameShell";
import { PracticeGame } from "@/components/games/PracticeGame";
import { worldQuery } from "@/lib/world.functions";
import { GAME_DEFS, flagRound, makeRound, quizRound } from "@/lib/games";

const META = {
  "higher-or-lower": "Two countries, one figure. Pick the higher one.",
  "guess-the-number": "Pick the right figure from four real published values.",
  "rank-the-world": "Spot the highest or lowest of four countries.",
  "guess-the-flag": "Spot the country from its national flag — four choices each time.",
  "english-history": "Kings, queens, battles and turning points — four choices each time.",
  "world-knowledge": "Capitals, geography, inventions and major world events — four choices each time.",
} as const;
type WorldGame = keyof typeof META;
const isWorldGame = (g: string): g is WorldGame => g in META;
const isQuiz = (g: string): g is "english-history" | "world-knowledge" => g === "english-history" || g === "world-knowledge";

export const Route = createFileRoute("/games/$game")({
  loader: ({ params, context }) => { if (!isWorldGame(params.game)) throw notFound(); return isQuiz(params.game) ? null : context.queryClient.ensureQueryData(worldQuery()); },
  head: ({ params }) => {
    const g = isWorldGame(params.game) ? params.game : null;
    const t = `${g ? GAME_DEFS[g].title : "Game"} — free stats game | UKStats`; const d = g ? META[g] : "Free statistics game.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: Page,
  notFoundComponent: () => <GameShell><p className="mt-6">That game doesn't exist.</p></GameShell>,
});

function Page() {
  const game = Route.useParams().game as WorldGame;
  return isQuiz(game) ? <QuizPage game={game} /> : <WorldPage game={game} />;
}

function QuizPage({ game }: { game: "english-history" | "world-knowledge" }) {
  const build = useCallback((seed: string) => quizRound(game, seed), [game]);
  return <GameShell note="Free to play. Questions come from a fixed, checked list of well-documented facts, each with a reference link — nothing is generated while you play."><PracticeGame key={game} game={game} title={GAME_DEFS[game].title} blurb={`${META[game]} 10 questions`} build={build} unavailable={false} /></GameShell>;
}

function WorldPage({ game }: { game: WorldGame }) {
  const { data } = useSuspenseQuery(worldQuery());
  const build = useCallback((seed: string) => (data ? game === "guess-the-flag" ? flagRound(data, seed) : makeRound(data, [...GAME_DEFS[game].kinds], `${game}-${seed}`) : []), [data, game]);
  return <GameShell><PracticeGame key={game} game={game} title={GAME_DEFS[game].title} blurb={`${META[game]} 10 questions`} build={build} unavailable={!data} /></GameShell>;
}
