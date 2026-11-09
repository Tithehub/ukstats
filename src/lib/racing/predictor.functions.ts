import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { getRacecards } from "./racing.functions";
import { predictRace } from "./predictor";

export interface Reasoning { text: string | null; generatedAt: string | null }

/** Short AI explanation of the scorer's ranking. The ranking itself never comes from the model. */
export const getPredictionReasoning = createServerFn({ method: "POST" })
  .inputValidator((d: { raceId: string; day: "today" | "tomorrow" }) => ({ raceId: String(d.raceId).slice(0, 120), day: d.day === "tomorrow" ? "tomorrow" as const : "today" as const }))
  .handler(async ({ data }): Promise<Reasoning> => {
    const cards = await getRacecards({ data: { day: data.day } });
    let course = "";
    const race = cards.meetings.flatMap((m) => m.races.map((r) => { if (r.id === data.raceId) course = m.course?.name ?? ""; return r; })).find((r) => r.id === data.raceId);
    if (!race || cards.demo) return { text: null, generatedAt: null };
    const p = predictRace(race);
    if (!p.ok) return { text: null, generatedAt: null };
    const top = p.ranked.slice(0, 4).map((r) => ({ rank: r.rank, horse: r.runner.horse?.name, facts: r.why, trainer: r.runner.trainer?.name ?? null, jockey: r.runner.jockey?.name ?? null }));
    const version = p.ranked.map((r) => r.runner.id).join(",");
    const id = `racing-predict-v1:${data.raceId}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = supabaseAdmin.from as unknown as (t: string) => any;
    try {
      const { data: row } = await from("payload_cache").select("data").eq("id", id).maybeSingle();
      if (row?.data?.version === version) return { text: row.data.text, generatedAt: row.data.generatedAt };
    } catch { /* no cache */ }
    try {
      const { aiJson } = await import("@/lib/agents/ai.server");
      const out = await aiJson<{ text: string }>({
        instructions: "You explain a horse-racing ranking that was already computed. Write 2-3 short plain-English sentences on why the top-ranked horse leads, using ONLY the facts given. Never mention odds, prices, betting, stakes or certainty. Never invent results, history or facts not provided. Call it an opinion.",
        input: JSON.stringify({ race: race.name, course, going: race.going, ranking: top }),
        schemaName: "reasoning",
        schema: { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string" } } },
      });
      const res = { version, text: out.text.slice(0, 600), generatedAt: new Date().toISOString() };
      try { await from("payload_cache").upsert({ id, data: res, updated_at: res.generatedAt }); } catch { /* memory only */ }
      return { text: res.text, generatedAt: res.generatedAt };
    } catch (e) {
      console.error("predictor reasoning failed", e);
      return { text: null, generatedAt: null };
    }
  });

export const reasoningQuery = (raceId: string, day: "today" | "tomorrow") => queryOptions({ queryKey: ["racing", "reason", raceId], queryFn: () => getPredictionReasoning({ data: { raceId, day } }), staleTime: 10 * 60_000, retry: false });
