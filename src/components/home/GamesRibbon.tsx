import { Link } from "@tanstack/react-router";
import daily from "@/assets/games/daily.jpg";
import britain from "@/assets/games/britain.jpg";
import hl from "@/assets/games/higher-lower.jpg";
import guess from "@/assets/games/guess.jpg";
import rank from "@/assets/games/rank.jpg";
import flag from "@/assets/games/flag.jpg";
import history from "@/assets/games/english-history.jpg";
import worldk from "@/assets/games/world-knowledge.jpg";
import aim from "@/assets/games/aim-high-vote-lowe.jpg";

const GAMES = [
  { href: "/games/daily", title: "Daily 5", img: daily },
  { href: "/games/britain-by-the-numbers", title: "Britain by the Numbers", img: britain },
  { href: "/games/aim-high-vote-lowe", title: "Aim High, Vote Lowe", img: aim },
  { href: "/games/higher-or-lower", title: "Higher or Lower", img: hl },
  { href: "/games/guess-the-number", title: "Guess the Number", img: guess },
  { href: "/games/rank-the-world", title: "Rank the World", img: rank },
  { href: "/games/guess-the-flag", title: "Guess the Flag", img: flag },
  { href: "/games/english-history", title: "English History", img: history },
  { href: "/games/world-knowledge", title: "World Knowledge & History", img: worldk },
];

function Item({ g, hidden }: { g: (typeof GAMES)[number]; hidden?: boolean }) {
  return (
    <a href={g.href} aria-hidden={hidden || undefined} tabIndex={hidden ? -1 : undefined} className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm font-medium text-card-foreground transition hover:border-primary">
      <img src={g.img} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" />
      <span className="whitespace-nowrap">{g.title}</span>
    </a>
  );
}

export function GamesRibbon() {
  return (
    <section aria-label="Free games" className="mt-4 rounded-lg border border-border bg-muted/40 p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-semibold">Free games <span className="font-normal text-muted-foreground">· free sign-up to play</span></p>
        <Link to="/games" className="text-sm text-primary underline">See all games &amp; leaderboards</Link>
      </div>
      <div className="games-ribbon overflow-x-auto">
        <div className="games-ribbon-track flex w-max gap-2">
          {GAMES.map((g) => <Item key={g.href} g={g} />)}
          {GAMES.map((g) => <Item key={g.href + "-2"} g={g} hidden />)}
        </div>
      </div>
    </section>
  );
}
