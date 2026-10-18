import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Admins only");
}

export const getAgentDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return { isAdmin: false as const };
    const { data: runs } = await supabase.from("agent_runs").select("*").order("started_at", { ascending: false }).limit(7);
    const latest = runs?.[0];
    const { data: findings } = latest
      ? await supabase.from("agent_findings").select("*").eq("run_id", latest.id).order("created_at")
      : { data: [] };
    const { data: drafts } = await supabase.from("explainer_drafts").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(30);
    return { isAdmin: true as const, runs: runs ?? [], findings: findings ?? [], drafts: drafts ?? [] };
  });

export const runAgentsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { runAgentTeam } = await import("@/lib/agents/engine.server");
    return await runAgentTeam({ force: true });
  });

export const reviewDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: d } = await context.supabase.from("explainer_drafts").select("metric_id").eq("id", data.id).single();
    if (data.approve && d) {
      await context.supabase.from("explainer_drafts").update({ status: "superseded" }).eq("metric_id", d.metric_id).eq("status", "approved");
    }
    await context.supabase.from("explainer_drafts").update({ status: data.approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });

export const dismissFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    await context.supabase.from("agent_findings").update({ status: "dismissed" }).eq("id", data.id);
    return { ok: true };
  });

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public: revisions log + any approved AI explainer for one figure. */
export const getMetricExtras = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    try {
      const sb = publicClient();
      const [rev, exp] = await Promise.all([
        sb.rpc("list_metric_revisions", { _metric_id: data.id, max_rows: 50 }),
        sb.rpc("get_approved_explainer", { _metric_id: data.id }),
      ]);
      const revisions = (rev.data ?? []) as { period: string; old_value: string; new_value: string; detected_at: string; source_url: string | null }[];
      const approved = ((exp.data ?? []) as { title: string; summary: string; sections: { heading: string; body: string }[] }[])[0] ?? null;
      return { revisions, approved };
    } catch {
      return { revisions: [], approved: null };
    }
  });

export const listAgentPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("agent_posts").select("*").in("status", ["pending", "approved"]).order("created_at", { ascending: false }).limit(40);
    return data ?? [];
  });

export const reviewAgentPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "posted"]), body: z.string().min(1).max(600).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: { status: string; reviewed_at: string; body?: string } = { status: data.status, reviewed_at: new Date().toISOString() };
    if (data.body) patch.body = data.body;
    await context.supabase.from("agent_posts").update(patch).eq("id", data.id);
    return { ok: true };
  });

export const SITE_DOMAINS = ["ukstats.co.uk", "www.ukstats.co.uk", "stat-central-uk.lovable.app", "stats.solutions", "www.stats.solutions"] as const;

export type DomainCheck = {
  domain: string;
  ok: boolean;
  status: number | null;
  redirectsTo: string | null;
  ms: number;
  error: string | null;
  checkedAt: string;
};

/** Admin: live reachability check for one site domain (or all). */
export const checkDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ domain: z.enum(SITE_DOMAINS).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const targets = data.domain ? [data.domain] : [...SITE_DOMAINS];
    const results: DomainCheck[] = await Promise.all(
      targets.map(async (domain) => {
        const started = Date.now();
        try {
          const res = await fetch(`https://${domain}/`, {
            redirect: "manual",
            signal: AbortSignal.timeout(12_000),
            headers: { "user-agent": "UKStats-domain-check/1.0" },
          });
          const loc = res.headers.get("location");
          const redirectsTo = res.status >= 300 && res.status < 400 && loc ? new URL(loc, `https://${domain}/`).host : null;
          return { domain, ok: res.status >= 200 && res.status < 400, status: res.status, redirectsTo, ms: Date.now() - started, error: null, checkedAt: new Date().toISOString() };
        } catch (e) {
          return { domain, ok: false, status: null, redirectsTo: null, ms: Date.now() - started, error: e instanceof Error ? e.message : "fetch failed", checkedAt: new Date().toISOString() };
        }
      }),
    );
    return results;
  });
