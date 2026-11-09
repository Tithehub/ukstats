import { createFileRoute } from "@tanstack/react-router";
import silks from "@/assets/racing/silks.jpg";
import { RacingLayout } from "@/components/racing/RacingLayout";
import { spBonus } from "@/lib/racing/racing";

export const Route = createFileRoute("/racing/competitions")({
  head: () => ({
    meta: [
      { title: "Free AI vs human racing competition — rules | UKStats" },
      { name: "description", content: "How the free UKStats racing competition works: pick one horse per race against the UKStats AI. No entry fee, no betting, 18+." },
      { property: "og:title", content: "Beat the UKStats AI — free racing competition" },
      { property: "og:description", content: "Free, no betting: pick a horse per race and compete against the AI on daily, weekly and monthly leaderboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <RacingLayout image={silks} title="AI vs human competition" intro="A free competition for signed-in UKStats users aged 18 or over. There's no entry fee, no prize money and no betting.">
    <div className="rounded-lg border border-racing-gold/60 bg-night-panel p-5">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-racing-gold">Opening soon</p>
      <p className="mt-2">The competition opens once a licensed racing data feed is connected, because picks have to be scored against official results.</p>
    </div>
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-night-line bg-night-panel p-5">
        <h2 className="text-lg font-semibold">How it will work</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-night-muted">
          <li>Pick one horse in each eligible race. The UKStats AI makes its own pick under the same rules.</li>
          <li>Picks lock at the official race start time, using the server's clock. Late picks are refused.</li>
          <li>If your horse becomes a non-runner, you score nothing for that race. Cancelled races don't count.</li>
          <li>There are daily, weekly (Monday to Sunday) and monthly tables, plus an all-time table. Past tables are kept for good.</li>
          <li>Points and win accuracy are shown as two separate measures.</li>
        </ul>
      </div>
      <div className="rounded-lg border border-night-line bg-night-panel p-5">
        <h2 className="text-lg font-semibold">Scoring (rule v1)</h2>
        <p className="mt-2 text-sm text-night-muted">Picking the winner scores 10 points, plus a bonus from the official starting price (SP): <span className="font-mono text-night-fg">MIN(10, MAX(0, ROUND(2 × (SP − 2))))</span>. A wrong pick scores 0.</p>
        <table className="mt-3 w-full text-sm"><thead className="text-left text-xs text-night-muted"><tr><th className="py-1 font-normal">Winner's SP (decimal)</th><th className="font-normal">Bonus</th><th className="font-normal">Total</th></tr></thead>
          <tbody>{[1.5, 3, 4, 6, 12].map((sp) => <tr key={sp} className="border-t border-night-line"><td className="py-1 font-mono">{sp.toFixed(2)}</td><td className="font-mono">{spBonus(sp)}</td><td className="font-mono">{10 + spBonus(sp)}</td></tr>)}</tbody></table>
        <p className="mt-2 text-xs text-night-muted">This is a competition rule, not a betting recommendation.</p>
      </div>
    </section>
  </RacingLayout>;
}
