import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { GameShell } from "@/components/games/GameShell";
import { LowesMission } from "@/components/games/LowesMission";

const T = "Lowe's Mission — London to Manchester arcade game | UKStats";
const D = "A free parody arcade game: fly caped Rupert Lowe from 10 Downing Street to Manchester, collect votes, smash rival MPs and defeat Prime Minister Andy Burnham.";

export const Route = createFileRoute("/games/lowes-mission")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: "https://ukstats.co.uk/games/lowes-mission" }] }),
  component: Page,
});

function Page() {
  return (
    <GameShell note="Parody game. Characters are cartoon caricatures and are not endorsed by anyone shown. No statistics are used; your best score is saved on this device and does not count toward the leaderboards.">
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Lowe's Mission</h1>
      <p className="mt-1 text-night-muted">From 10 Downing Street to Manchester — collect votes, smash the MPs, beat the Prime Minister.</p>
      <ClientOnly fallback={<div className="mt-4 aspect-[16/9] w-full rounded-lg bg-night-panel" />}>
        <LowesMission />
      </ClientOnly>
    </GameShell>
  );
}
