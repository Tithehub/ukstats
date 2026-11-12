import { createFileRoute, Link } from "@tanstack/react-router";
import { GameShell } from "@/components/games/GameShell";
import { Leaderboard } from "@/components/games/Leaderboard";
import { ArcadeLeaderboard } from "@/components/games/ArcadeLeaderboard";
import daily from "@/assets/games/daily.jpg";
import hl from "@/assets/games/higher-lower.jpg";
import guess from "@/assets/games/guess.jpg";
import rank from "@/assets/games/rank.jpg";
import britain from "@/assets/games/britain.jpg";
import flag from "@/assets/games/flag.jpg";
import history from "@/assets/games/english-history.jpg";
import worldk from "@/assets/games/world-knowledge.jpg";
import dash from "@/assets/games/aim-high-vote-lowe.jpg";

const T = "Free stats games — Daily 5, Higher or Lower and more | UKStats";
const D = "Free, quick statistics games built on real World Bank figures: the Daily 5 challenge, Britain by the Numbers, Higher or Lower, Guess the Number, Rank the World, Guess the Flag, English History and World Knowledge. Leaderboards and shareable scores.";

export const Route = createFileRoute("/games/")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { property: "og:image", content: "https://ukstats.co.uk/og/games-daily.jpg" }, { name: "twitter:image", content: "https://ukstats.co.uk/og/games-daily.jpg" }], links: [{ rel: "canonical", href: "https://ukstats.co.uk/games" }] }),
  component: Hub,
});

const GAMES = [
  { game: "higher-or-lower", title: "Higher or Lower", blurb: "Two countries, one figure — pick the higher.", img: hl },
  { game: "guess-the-number", title: "Guess the Number", blurb: "Pick the right figure from four.", img: guess },
  { game: "rank-the-world", title: "Rank the World", blurb: "Spot the top country from four.", img: rank },
  { game: "guess-the-flag", title: "Guess the Flag", blurb: "Name the country from its real national flag.", img: flag },
  { game: "english-history", title: "English History", blurb: "Monarchs, battles and turning points.", img: history },
  { game: "world-knowledge", title: "World Knowledge & History", blurb: "Capitals, inventions and world events.", img: worldk },
] as const;

function Hub() {
  return (
    <GameShell back={false}>
      <h1 className="text-4xl font-semibold tracking-tight">Test your knowledge. Challenge the world.</h1>
      <p className="mt-2 text-night-muted">Free, 1-minute games built on real published figures. Learn something every round. Free sign-up needed to play.</p>
      <Link to="/games/daily" className="mt-6 grid overflow-hidden rounded-lg border border-electric-soft bg-night-panel sm:grid-cols-2">
        <img src={daily} alt="The Daily 5" width={1200} height={800} className="h-full w-full object-cover" />
        <div className="p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-electric-soft">Today's challenge</p>
          <h2 className="mt-1 text-2xl font-semibold">The Daily 5</h2>
          <p className="mt-2 text-night-muted">Five questions, same for everyone, one go a day. Build your streak and top the leaderboard.</p>
          <span className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Play today's 5</span>
        </div>
      </Link>
      <Link to="/games/britain-by-the-numbers" className="mt-4 grid overflow-hidden rounded-lg border border-night-line bg-night-panel transition hover:border-electric-soft sm:grid-cols-2">
        <img src={britain} alt="" width={1200} height={800} loading="lazy" className="h-full w-full object-cover" />
        <div className="p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-electric-soft">UK only</p>
          <h2 className="mt-1 text-2xl font-semibold">Britain by the Numbers</h2>
          <p className="mt-2 text-night-muted">Councils head to head on house prices, pay, crime, age and life satisfaction — real ONS and Land Registry figures.</p>
        </div>
      </Link>
      <Link to="/games/aim-high-vote-lowe" className="mt-4 grid overflow-hidden rounded-lg border border-night-line bg-night-panel transition hover:border-electric-soft sm:grid-cols-2">
        <img src={dash} alt="" width={1200} height={800} loading="lazy" className="h-full w-full object-cover" />
        <div className="p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-electric-soft">Arcade · parody</p>
          <h2 className="mt-1 text-2xl font-semibold">Aim High, Vote Lowe</h2>
          <p className="mt-2 text-night-muted">Caped RUPERT AIM HIGH VOTE LOWE flies from 10 Downing Street to Manchester — collect votes, blast Kemi Had Enough, Banana Mahmood, Angela Raver, Sadiq Can't and Zack Boobanski off the screen, send Andy Birdman running and defeat the MASTERMIND.</p>
        </div>
      </Link>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.game} to="/games/$game" params={{ game: g.game }} className="overflow-hidden rounded-lg border border-night-line bg-night-panel transition hover:border-electric-soft">
            <img src={g.img} alt="" width={1200} height={800} loading="lazy" className="aspect-[3/2] w-full object-cover" />
            <div className="p-4"><h3 className="font-semibold">{g.title}</h3><p className="mt-1 text-sm text-night-muted">{g.blurb}</p></div>
          </Link>
        ))}
      </div>
      <div className="mt-8"><Leaderboard choose /></div>
      <div className="mt-6"><ArcadeLeaderboard /></div>
    </GameShell>
  );
}
