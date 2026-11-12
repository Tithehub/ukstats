import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DIFFICULTIES, maxPlausibleScore, type Difficulty } from "./lowes-mission";

/** A new run replaces today's saved best only when it scores higher. */
export function shouldReplace(existing: number | null, next: number): boolean {
  return existing === null || next > existing;
}

/** Saves an arcade run. Reflex scores can't be re-played server-side, so they are capped and kept as one best per level per London day. */
export const submitArcadeScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { difficulty: Difficulty; score: number; seconds: number }) => {
    if (!DIFFICULTIES.includes(d?.difficulty)) throw new Error("Bad level");
    const score = Math.floor(Number(d.score)), seconds = Math.floor(Number(d.seconds));
    if (!Number.isFinite(score) || !Number.isFinite(seconds) || score < 0 || seconds < 0) throw new Error("Bad score");
    return { difficulty: d.difficulty, score, seconds };
  })
  .handler(async ({ data, context }) => {
    if (data.score > maxPlausibleScore(data.difficulty, data.seconds)) return { ok: false as const, error: "That score isn't possible for this level, so it wasn't saved." };
    const { londonDate } = await import("./daily");
    const day = londonDate();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("arcade_scores").select("id, score").eq("user_id", context.userId).eq("game", "aim-high-vote-lowe").eq("difficulty", data.difficulty).eq("day", day).maybeSingle();
    const prev = row ? (row.score as number) : null;
    if (!shouldReplace(prev, data.score)) return { ok: true as const, improved: false, best: prev as number };
    const { error } = row
      ? await supabaseAdmin.from("arcade_scores").update({ score: data.score, seconds: data.seconds }).eq("id", row.id)
      : await supabaseAdmin.from("arcade_scores").insert({ user_id: context.userId, game: "aim-high-vote-lowe", difficulty: data.difficulty, score: data.score, seconds: data.seconds, day });
    return error ? { ok: false as const, error: "Couldn't save your score." } : { ok: true as const, improved: true, best: data.score };
  });
