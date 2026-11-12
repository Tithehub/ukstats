import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Answer } from "./games";

export const GAMES = ["daily-5"] as const;

/** Scores a Daily 5 entry on the server from the same seeded questions; one entry per player per London day. */
export const submitDaily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { answers: Answer[] }) => {
    if (!Array.isArray(d?.answers) || d.answers.length > 10) throw new Error("Bad answers");
    return { answers: d.answers.map((a) => (typeof a === "number" || a === null ? a : Array.isArray(a) ? a.slice(0, 5).map(String) : null)) };
  })
  .handler(async ({ data, context }) => {
    const { loadWorld } = await import("./world.server");
    const { dailyRound, scoreQuestion } = await import("./games");
    const { londonDate } = await import("./daily");
    const day = londonDate();
    const world = await loadWorld();
    if (!world) return { ok: false as const, error: "World figures are unavailable right now." };
    const qs = dailyRound(world, day);
    const points = qs.map((q, i) => scoreQuestion(q, data.answers[i] ?? null));
    const score = points.reduce((a, b) => a + b, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("game_scores").insert({ user_id: context.userId, game: "daily-5", day, score, max_score: qs.length * 100, answers: data.answers as never });
    if (error) return { ok: false as const, error: error.code === "23505" ? "You've already played today's Daily 5 — come back tomorrow." : "Couldn't save your score." };
    return { ok: true as const, score, points };
  });

export const myDaily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { londonDate } = await import("./daily");
    const { data } = await context.supabase.from("game_scores").select("score, max_score, day").eq("game", "daily-5").order("day", { ascending: false }).limit(60);
    const rows = data ?? [];
    const today = londonDate();
    let streak = 0; const d = new Date(today + "T12:00:00Z");
    const days = new Set(rows.map((r) => r.day));
    if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
    return { today: rows.find((r) => r.day === today) ?? null, streak, played: rows.length, best: rows.reduce((m, r) => Math.max(m, r.score), 0) };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((d: { period: "day" | "week" | "all" }) => ({ period: d?.period === "week" || d?.period === "all" ? d.period : "day" as const }))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { londonDate } = await import("./daily");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
    });
    const until = londonDate(); const s = new Date(until + "T12:00:00Z");
    if (data.period === "week") s.setUTCDate(s.getUTCDate() - 6);
    const since = data.period === "all" ? "2026-01-01" : s.toISOString().slice(0, 10);
    const { data: rows, error } = await sb.rpc("game_leaderboard", { _game: "daily-5", _since: since, _until: until, max_rows: 50 });
    if (error) return { rows: [], error: "Leaderboard unavailable right now." };
    return { rows: ((rows ?? []) as { player: string; total: number; games: number; best: number }[]).map((r) => ({ player: r.player, total: Number(r.total), games: Number(r.games), best: r.best })), error: null };
  });

export const leaderboardQuery = (period: "day" | "week" | "all") => queryOptions({ queryKey: ["game-leaderboard", period], queryFn: () => getLeaderboard({ data: { period } }), staleTime: 60_000 });
