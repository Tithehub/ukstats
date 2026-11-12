import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { GameShell } from "@/components/games/GameShell";
import { PracticeGame } from "@/components/games/PracticeGame";
import { placesQuery } from "@/lib/places.functions";
import { britainRound } from "@/lib/games";

const T = "Britain by the Numbers — UK stats game | UKStats";
const D = "How well do you know Britain? Compare councils on house prices, pay, crime, age and life satisfaction — real ONS, Land Registry and police figures. Free.";

export const Route = createFileRoute("/games/britain-by-the-numbers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(placesQuery()),
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(placesQuery());
  const build = useCallback((seed: string) => britainRound(data, seed), [data]);
  return (
    <GameShell note="Free to play. Every answer is a council figure exactly as published by ONS, HM Land Registry (UK HPI) or the police recorded-crime tables, with its source shown — nothing is estimated or made up.">
      <PracticeGame game="britain-by-the-numbers" title="Britain by the Numbers" blurb="Councils head to head on house prices, pay, crime, age and life satisfaction. 10 questions" build={build} unavailable={!data?.places.length} />
    </GameShell>
  );
}
