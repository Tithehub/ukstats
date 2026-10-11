/**
 * Server-only overnight agent team. Agents read published data and write
 * findings/drafts only — they never change figures, code or social posts.
 */
import { getUkStats } from "@/lib/uk-stats.functions";
import { explainerById } from "@/lib/explained";
import type { Metric } from "@/lib/uk-stats";
import { aiJson, AiBlockedError } from "./ai.server";
import { countryFigureOfDay, figureOfDay, releaseDay } from "./marketing";
import { feedWatchdog, dataAuditor, type Finding } from "./findings";
import { countryWatchdog } from "./countries.server";
import { COUNTRIES } from "@/lib/countries";
import { loadCountryStats } from "@/lib/countries.server";

/** Marketing agent: drafts posts for owner approval; skips anything already drafted today. */
async function marketingAgent(db: Db, metrics: Metric[], runId: string): Promise<Finding[]> {
  const since = new Date(Date.now() - 20 * 3600_000).toISOString();
  const { data: recent } = await db.from("agent_posts").select("metric_id, platform, kind").gte("created_at", since);
  const seen = new Set((recent ?? []).map((r: { metric_id: string; platform: string; kind: string }) => `${r.kind}|${r.metric_id}|${r.platform}`));
  const day = Math.floor(Date.now() / 86_400_000);
  const country = COUNTRIES[day % COUNTRIES.length]!;
  const payload = await loadCountryStats(country.code);
  const rows = [...figureOfDay(metrics), ...releaseDay(metrics), ...(payload ? countryFigureOfDay(payload) : [])]
    .filter((p) => !seen.has(`${p.kind}|${p.metric_id}|${p.platform}`))
    .map((p) => ({ ...p, run_id: runId }));
  if (!rows.length) return [];
  const { error } = await db.from("agent_posts").insert(rows);
  if (error)
    return [{ agent: "Marketing", severity: "critical", title: "Social post drafts could not be saved", detail: `${error.message} (${rows.length} draft(s) lost)` }];
  return [{ agent: "Marketing", severity: "info", title: `${rows.length} social post draft(s) awaiting your approval` }];
}


const SITE = "https://ukstats.co.uk";
const PAGES = ["/", "/register", "/daily", "/status", "/compare", "/calendar", "/regions", "/maps", "/press", "/polling", "/tax-vs-welfare", "/foreign-aid", "/api-docs", "/coverage"];
const MAX_DRAFTS = 2;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;


async function revisionDetective(db: Db, metrics: Metric[]): Promise<Finding[]> {
  const { data: prior } = await db.from("metric_snapshots").select("metric_id, value, period");
  const before = new Map<string, { value: string; period: string | null }>((prior ?? []).map((r: { metric_id: string; value: string; period: string | null }) => [r.metric_id, r]));
  const rows = [];
  const out: Finding[] = [];
  for (const m of metrics) {
    const was = before.get(m.id);
    if (m.status !== "ok" || !m.value || !m.period || !was || was.period !== m.period || was.value === m.value) continue;
    rows.push({ metric_id: m.id, title: m.title, period: m.period, old_value: was.value, new_value: m.value, source: m.source, source_url: m.sourceUrl });
    out.push({ agent: "Revision Detective", severity: "info", metric_id: m.id, title: `${m.title} revised for ${m.period}`, detail: `${was.value} → ${m.value} (same period, publisher revision)`, url: m.sourceUrl });
  }
  if (rows.length) await db.from("metric_revisions").upsert(rows, { onConflict: "metric_id,period,old_value,new_value", ignoreDuplicates: true });
  return out;
}

async function seoInspector(metrics: Metric[]): Promise<Finding[]> {
  const out: Finding[] = [];
  const titles = new Map<string, string>();
  const TIMEOUT = 45_000;
  const failed: string[] = [];
  let lastError = "";
  for (const path of PAGES) {
    try {
      const res = await fetch(SITE + path, { headers: { "User-Agent": "UKStats-Inspector/1.0" }, signal: AbortSignal.timeout(TIMEOUT) });
      if (!res.ok) {
        out.push({ agent: "SEO & Accessibility", severity: "critical", title: `${path} returned ${res.status}`, url: SITE + path });
        continue;
      }
      const html = await res.text();
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
      if (!title) out.push({ agent: "SEO & Accessibility", severity: "warning", title: `${path} has no page title`, url: SITE + path });
      else if (titles.has(title)) out.push({ agent: "SEO & Accessibility", severity: "warning", title: `${path} shares its title with ${titles.get(title)}`, url: SITE + path });
      else titles.set(title, path);
      if (!/<meta[^>]+name=["']description["']/i.test(html)) out.push({ agent: "SEO & Accessibility", severity: "warning", title: `${path} has no meta description`, url: SITE + path });
      const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
      if (h1 !== 1) out.push({ agent: "SEO & Accessibility", severity: "info", title: `${path} has ${h1} main headings (should be 1)`, url: SITE + path });
      const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
      const noAlt = imgs.filter((t) => !/\balt=/i.test(t)).length;
      if (noAlt) out.push({ agent: "SEO & Accessibility", severity: "info", title: `${path}: ${noAlt} image(s) without alt text`, url: SITE + path });
      if (!/<html[^>]+lang=/i.test(html)) out.push({ agent: "SEO & Accessibility", severity: "warning", title: `${path} missing page language`, url: SITE + path });
    } catch (e) {
      failed.push(path);
      lastError = String(e).slice(0, 120);
    }
  }
  if (failed.length)
    out.push({
      agent: "SEO & Accessibility",
      severity: failed.length === PAGES.length ? "critical" : "warning",
      title: failed.length === PAGES.length ? "The site could not be fetched for the nightly check" : `${failed.length} page(s) could not be fetched: ${failed.join(", ")}`,
      detail: lastError,
      url: SITE,
    });
  try {
    const sm = await (await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(TIMEOUT) })).text();
    if (!sm.includes("<urlset")) {
      out.push({ agent: "SEO & Accessibility", severity: "warning", title: "sitemap.xml did not return a sitemap", detail: sm.slice(0, 120), url: `${SITE}/sitemap.xml` });
    } else {
      const missing = metrics.filter((m) => !sm.includes(`/explained/${m.id}<`));
      if (missing.length)
        out.push({
          agent: "SEO & Accessibility",
          severity: "info",
          title: `${missing.length} explainer pages not listed in the sitemap`,
          detail: missing.slice(0, 8).map((m) => m.id).join(", "),
          url: `${SITE}/sitemap.xml`,
        });
    }
  } catch (e) {
    out.push({ agent: "SEO & Accessibility", severity: "warning", title: "sitemap.xml could not be fetched", detail: String(e).slice(0, 120), url: `${SITE}/sitemap.xml` });
  }
  return out;
}

const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sections"],
  properties: {
    summary: { type: "string" },
    sections: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["heading", "body"], properties: { heading: { type: "string" }, body: { type: "string" } } },
    },
  },
};

async function explainerWriter(db: Db, metrics: Metric[]): Promise<{ findings: Finding[]; drafted: number }> {
  const { data: existing } = await db.from("explainer_drafts").select("metric_id").in("status", ["pending", "approved"]);
  const has = new Set((existing ?? []).map((r: { metric_id: string }) => r.metric_id));
  const todo = metrics.filter((m) => m.status === "ok" && !explainerById(m.id) && !has.has(m.id)).slice(0, MAX_DRAFTS);
  let drafted = 0;
  for (const m of todo) {
    const facts = { title: m.title, sub: m.sub, publisher: m.source, sourceUrl: m.sourceUrl, period: m.period, cadence: m.cadence, publisherNote: m.note, derivation: m.derivedFrom, category: m.category };
    const d = await aiJson<{ summary: string; sections: { heading: string; body: string }[] }>({
      schemaName: "explainer",
      schema: DRAFT_SCHEMA,
      instructions:
        "You write plain-English explainers for an official UK statistics site. Use ONLY the facts provided. Never state, estimate or invent any number, date or claim not present in the facts. Do not quote the current value. Write 3-4 short sections (What it measures, Who publishes it and how, How to read it, Caveats) in British English, neutral tone, max 70 words each, plus a one-sentence summary.",
      input: JSON.stringify(facts),
    });
    await db.from("explainer_drafts").insert({ metric_id: m.id, title: `${m.title}: the official figure explained`, summary: d.summary, sections: d.sections.slice(0, 6) });
    drafted++;
  }
  return { drafted, findings: drafted ? [{ agent: "Explainer Writer", severity: "info", title: `${drafted} new explainer draft(s) awaiting your approval` }] : [] };
}

async function chiefOfStaff(findings: Finding[], stats: { tracked: number; drafted: number }): Promise<string> {
  const top = findings.slice(0, 60).map((f) => `[${f.severity}] ${f.agent}: ${f.title}${f.detail ? ` — ${f.detail}` : ""}`).join("\n");
  const r = await aiJson<{ briefing: string }>({
    schemaName: "briefing",
    schema: { type: "object", additionalProperties: false, required: ["briefing"], properties: { briefing: { type: "string" } } },
    instructions:
      "You are chief of staff for ukstats.co.uk. Write a short morning briefing for the owner (max 180 words, British English, plain words, no jargon): 1) what broke, 2) what publishers revised or released, 3) the top 3 suggested next actions, prioritised. Only use the findings given; never invent figures.",
    input: `Feeds tracked: ${stats.tracked}. Explainer drafts written: ${stats.drafted}.\nFindings:\n${top || "None — everything checked out."}`,
  });
  return r.briefing;
}

function fallbackBriefing(findings: Finding[]): string {
  const c = findings.filter((f) => f.severity === "critical").length;
  const w = findings.filter((f) => f.severity === "warning").length;
  return `Overnight checks complete: ${c} critical, ${w} warnings, ${findings.length - c - w} notes. ${findings.slice(0, 3).map((f) => f.title).join("; ") || "Nothing needs attention."}`;
}

export async function runAgentTeam(opts: { force?: boolean } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as Db;

  // Single-flight lock.
  const { data: active } = await db.from("agent_runs").select("id").eq("status", "running").gt("lease_until", new Date().toISOString()).limit(1);
  if (active?.length) return { skipped: "already running" };
  const { data: last } = await db.from("agent_runs").select("status").order("started_at", { ascending: false }).limit(1);
  const aiPaused = !opts.force && last?.[0]?.status === "paused";

  const { data: run } = await db.from("agent_runs").insert({}).select("id").single();
  const runId = run.id as string;
  const findings: Finding[] = [];
  let pauseReason: string | null = null;
  let drafted = 0;

  try {
    const stats = await getUkStats();
    const metrics = stats.metrics;
    const countryChecks = await countryWatchdog(db);
    findings.push(...feedWatchdog(metrics), ...dataAuditor(metrics));
    findings.push(...countryChecks.findings);
    findings.push(...(await revisionDetective(db, metrics)));
    findings.push(...(await marketingAgent(db, metrics, runId)));
    findings.push(...(await seoInspector(metrics)));

    let briefing = fallbackBriefing(findings);
    if (!aiPaused) {
      try {
        const w = await explainerWriter(db, metrics);
        drafted = w.drafted;
        findings.push(...w.findings);
        briefing = await chiefOfStaff(findings, { tracked: metrics.length + countryChecks.tracked, drafted });
      } catch (e) {
        if (e instanceof AiBlockedError && [401, 402, 403, 429].includes(e.status)) pauseReason = e.message;
        findings.push({ agent: "Chief of Staff", severity: "warning", title: "AI step stopped", detail: e instanceof Error ? e.message : String(e) });
      }
    } else {
      findings.push({ agent: "Chief of Staff", severity: "warning", title: "AI agents paused after last run — press Run now to retry" });
    }

    if (findings.length) await db.from("agent_findings").insert(findings.map((f) => ({ ...f, run_id: runId })));
    await db.from("agent_runs").update({
      status: pauseReason ? "paused" : "done",
      pause_reason: pauseReason,
      finished_at: new Date().toISOString(),
      briefing,
      summary: { tracked: metrics.length + countryChecks.tracked, findings: findings.length, drafted },
    }).eq("id", runId);
    return { runId, findings: findings.length, drafted, paused: pauseReason };
  } catch (e) {
    await db.from("agent_runs").update({ status: "failed", finished_at: new Date().toISOString(), briefing: `Run failed: ${String(e).slice(0, 300)}` }).eq("id", runId);
    throw e;
  }
}
