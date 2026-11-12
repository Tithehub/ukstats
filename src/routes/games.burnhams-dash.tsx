import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { GameShell } from "@/components/games/GameShell";
import { BurnhamsDash } from "@/components/games/BurnhamsDash";

const T = "Burnham's Dash — London to Manchester arcade game | UKStats";
const D = "A free parody flappy-style game: fly from 10 Downing Street to Manchester, collect coins, dodge scandals, jump riot barricades and avoid rival MPs.";

export const Route = createFileRoute("/games/burnhams-dash")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: "https://ukstats.co.uk/games/burnhams-dash" }] }),
  component: Page,
});

function Page() {
  return (
    <GameShell note="Parody game. Characters are cartoon caricatures and are not endorsed by anyone shown. No statistics are used; your best score is saved on this device and does not count toward the leaderboards.">
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Burnham's Dash</h1>
      <p className="mt-1 text-night-muted">From 10 Downing Street to Manchester — coins, scandals, riots and rival MPs.</p>
      <ClientOnly fallback={<div className="mt-4 aspect-[16/9] w-full rounded-lg bg-night-panel" />}>
        <BurnhamsDash />
      </ClientOnly>
    </GameShell>
  );
}
