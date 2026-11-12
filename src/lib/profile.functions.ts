import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The caller's games record, grouped by game. */
export const myProfileStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { londonDate } = await import("./daily");
    const today = londonDate();
    const { data } = await context.supabase.from("game_scores").select("game, day, score, max_score").eq("user_id", context.userId).order("day", { ascending: false }).limit(1000);
    const by: Record<string, { days: number; best: number; today: number | null; max: number }> = {};
    for (const r of data ?? []) {
      const g = (by[r.game] ??= { days: 0, best: 0, today: null, max: r.max_score });
      g.days++; g.best = Math.max(g.best, r.score); if (r.day === today) g.today = r.score;
    }
    const days = new Set((data ?? []).filter((r) => r.game === "daily-5").map((r) => r.day));
    let streak = 0; const d = new Date(today + "T12:00:00Z");
    if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
    return { games: by, streak };
  });

/** Permanently removes the caller's own scores, avatar, profile and account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { confirm: string }) => { if (d?.confirm !== "DELETE") throw new Error("Type DELETE to confirm."); return d; })
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = context.userId;
    const { data: files } = await supabaseAdmin.storage.from("avatars").list(id);
    if (files?.length) await supabaseAdmin.storage.from("avatars").remove(files.map((f) => `${id}/${f.name}`));
    await supabaseAdmin.from("game_scores").delete().eq("user_id", id);
    await supabaseAdmin.from("profiles").delete().eq("id", id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    return error ? { ok: false as const, error: "Couldn't delete your account. Please try again." } : { ok: true as const };
  });
