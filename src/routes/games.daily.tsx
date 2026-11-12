import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameShell } from "@/components/games/GameShell";
import { QuestionCard } from "@/components/games/QuestionCard";
import { ShareResult } from "@/components/games/ShareResult";
import { Leaderboard } from "@/components/games/Leaderboard";
import { worldQuery } from "@/lib/world.functions";
import { myDaily, submitScore } from "@/lib/games.functions";
import { dailyRound, shareBlocks, type Answer } from "@/lib/games";
import { londonDate } from "@/lib/daily";
import { useAuth } from "@/lib/useAuth";

const T = "The Daily 5 — today's stats challenge | UKStats";
const D = "Five questions a day from real World Bank figures. Same questions for everyone, one go each, daily leaderboard. Free.";

export const Route = createFileRoute("/games/daily")({
  loader: ({ context }) => context.queryClient.ensureQueryData(worldQuery()),
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { property: "og:image", content: "https://ukstats.co.uk/og/games-daily.jpg" }, { name: "twitter:image", content: "https://ukstats.co.uk/og/games-daily.jpg" }] }),
  component: Daily,
});

function Daily() {
  const { data } = useSuspenseQuery(worldQuery());
  const { session } = useAuth();
  const qc = useQueryClient();
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => setDay(londonDate()), []);
  const qs = useMemo(() => (data && day ? dailyRound(data, day) : []), [data, day]);
  const mine = useQuery({ queryKey: ["my-daily", session?.user.id], queryFn: () => myDailyFn({ data: { game: "daily-5" } }), enabled: !!session });
  const myDailyFn = useServerFn(myDaily); const submit = useServerFn(submitScore);
  const [i, setI] = useState(0); const [answers, setAnswers] = useState<Answer[]>([]); const [pts, setPts] = useState<number[]>([]);
  const [saved, setSaved] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const finished = qs.length > 0 && i >= qs.length;
  const total = pts.reduce((a, b) => a + b, 0);
  const already = mine.data?.today;

  const save = async () => {
    setSaving(true);
    try { const r = await submit({ data: { game: "daily-5", answers } }); setSaved(r.ok ? `Saved — ${r.score} points on today's board.` : r.error); await qc.invalidateQueries(); }
    catch { setSaved("Couldn't save your score — please try again."); }
    setSaving(false);
  };

  return (
    <GameShell>
      <h1 className="mt-4 text-3xl font-semibold">The Daily 5</h1>
      <p className="mt-1 text-night-muted">{day ? `Today's set · ${day}` : ""} · new questions at midnight UK time{mine.data ? ` · your streak ${mine.data.streak} day${mine.data.streak === 1 ? "" : "s"}` : ""}</p>
      <div className="mt-6">
        {!data ? <p>World figures are unavailable right now — please try again shortly.</p>
          : already ? <div className="rounded-lg border border-night-line bg-night-panel p-6"><p className="text-xl font-semibold">You've played today: {already.score} / {already.max_score}</p><p className="mt-1 text-night-muted">Come back tomorrow for a new set.</p></div>
          : !qs.length ? <p>Loading…</p>
          : finished ? (
            <div className="space-y-4 rounded-lg border border-night-line bg-night-panel p-6">
              <p className="text-2xl font-semibold">{total} / {qs.length * 100}</p>
              <p className="text-3xl">{shareBlocks(pts)}</p>
              {session ? (saved ? <p role="status">{saved}</p> : <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save to leaderboard"}</Button>)
                : <p>Want your name on the leaderboard? <Link to="/auth" className="text-electric-soft underline">Sign in free</Link>, then play tomorrow's set.</p>}
              <ShareResult text={`UKStats Daily 5 · ${day} · ${total}/${qs.length * 100}\n${shareBlocks(pts)}`} url="https://ukstats.co.uk/games/daily" />
            </div>
          ) : (
            <>
              <p className="mb-2 font-mono text-sm text-night-muted">Question {i + 1} of {qs.length} · {total} points</p>
              <QuestionCard key={i} q={qs[i]!} onDone={(a, p) => { setAnswers((x) => [...x, a]); setPts((x) => [...x, p]); setI((n) => n + 1); }} />
            </>
          )}
      </div>
      <div className="mt-8"><Leaderboard game="daily-5" /></div>
    </GameShell>
  );
}
