import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Answer } from "./games";

/** Scores a round on the server by rebuilding the same seeded questions from the published data.
 *  Daily 5: one entry per player per London day. Other games: the day's best round counts. */
export const submitScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { game: string; seed?: string; answers: Answer[] }) => {
    if (typeof d?.game !== "string" || !Array.isArray(d.answers) || d.answers.length > 10) throw new Error("Bad answers");
    const seed = typeof d.seed === "string" ? d.seed.slice(0, 40) : "";
    return { game: d.game, seed, answers: d.answers.map((a) => (typeof a === "number" || a === null ? a : Array.isArray(a) ? a.slice(0, 5).map(String) : null)) };
  })
  .handler(async ({ data, context }) => {
    const g = await import("./games");
    if (!g.isGameId(data.game)) return { ok: false as const, error: "Unknown game." };
    const { londonDate } = await import("./daily");
    const day = londonDate();
    let qs: import("./games").Question[];
    if (data.game === "english-history" || data.game === "world-knowledge") {
      qs = g.quizRound(data.game, data.seed);
    } else if (data.game === "britain-by-the-numbers") {
      const { loadPlaces } = await import("./places.server");
      const places = await loadPlaces();
      if (!places?.places.length) return { ok: false as const, error: "UK figures are unavailable right now." };
      qs = g.britainRound(places, data.seed);
    } else {
      const { loadWorld } = await import("./world.server");
      const world = await loadWorld();
      if (!world) return { ok: false as const, error: "World figures are unavailable right now." };
      qs = data.game === "daily-5" ? g.dailyRound(world, day) : data.game === "guess-the-flag" ? g.flagRound(world, data.seed) : g.makeRound(world, [...g.GAME_DEFS[data.game as Exclude<typeof data.game, "english-history" | "world-knowledge">].kinds], `${data.game}-${data.seed}`);
    }
    if (qs.length !== data.answers.length) return { ok: false as const, error: "That round has changed — please play a new one." };
    const points = qs.map((q, i) => g.scoreQuestion(q, data.answers[i] ?? null));
    const score = points.reduce((a, b) => a + b, 0);
    const row = { user_id: context.userId, game: data.game, day, score, max_score: qs.length * 100, answers: data.answers as never };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.game === "daily-5") {
      const { error } = await supabaseAdmin.from("game_scores").insert(row);
      if (error) return { ok: false as const, error: error.code === "23505" ? "You've already played today's Daily 5 — come back tomorrow." : "Couldn't save your score." };
      return { ok: true as const, score, points, best: score };
    }
    const { data: prev } = await supabaseAdmin.from("game_scores").select("id, score").eq("user_id", context.userId).eq("game", data.game).eq("day", day).maybeSingle();
    if (prev && prev.score >= score) return { ok: true as const, score, points, best: prev.score };
    const { error } = prev ? await supabaseAdmin.from("game_scores").update(row).eq("id", prev.id) : await supabaseAdmin.from("game_scores").insert(row);
    if (error) return { ok: false as const, error: "Couldn't save your score." };
    return { ok: true as const, score, points, best: score };
  });

/** Leaderboard name = profile display name. */
export const setPlayerName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => {
    const name = String(d?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    if (name.length < 2) throw new Error("Name must be at least 2 characters.");
    return { name };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").upsert({ id: context.userId, display_name: data.name });
    return error ? { ok: false as const, error: "Couldn't save that name." } : { ok: true as const, name: data.name };
  });

export const myPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("display_name").eq("id", context.userId).maybeSingle();
    return { name: data?.display_name ?? "" };
  });

export const myDaily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { game?: string } | undefined) => ({ game: typeof d?.game === "string" ? d.game : "daily-5" }))
  .handler(async ({ data: input, context }) => {
    const { londonDate } = await import("./daily");
    const { data } = await context.supabase.from("game_scores").select("score, max_score, day").eq("game", input.game).order("day", { ascending: false }).limit(60);
    const rows = data ?? [];
    const today = londonDate();
    let streak = 0; const d = new Date(today + "T12:00:00Z");
    const days = new Set(rows.map((r) => r.day));
    if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
    while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
    return { today: rows.find((r) => r.day === today) ?? null, streak, played: rows.length, best: rows.reduce((m, r) => Math.max(m, r.score), 0) };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((d: { game: string; period: "day" | "week" | "all" }) => ({ game: typeof d?.game === "string" ? d.game.slice(0, 40) : "daily-5", period: d?.period === "week" || d?.period === "all" ? d.period : "day" as const }))
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
    const { data: rows, error } = await sb.rpc("game_leaderboard", { _game: data.game, _since: since, _until: until, max_rows: 50 });
    if (error) return { rows: [], error: "Leaderboard unavailable right now." };
    return { rows: ((rows ?? []) as { player: string; total: number; games: number; best: number }[]).map((r) => ({ player: r.player, total: Number(r.total), games: Number(r.games), best: r.best })), error: null };
  });

export const leaderboardQuery = (game: string, period: "day" | "week" | "all") => queryOptions({ queryKey: ["game-leaderboard", game, period], queryFn: () => getLeaderboard({ data: { game, period } }), staleTime: 30_000 });
