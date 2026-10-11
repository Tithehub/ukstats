/** Marketing agent: drafts posts from published figures only. Numbers are copied verbatim. */
import type { Metric } from "@/lib/uk-stats";
import type { CountryPayload } from "@/lib/countries";

export const SITE = "https://ukstats.co.uk";
export const PLATFORMS = ["bluesky", "mastodon"] as const;
const LIMIT = { bluesky: 300, mastodon: 500 } as const;

export function tagLink(path: string, platform: string, campaign = "agent"): string {
  const u = new URL(path, SITE);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

export type DraftPost = { kind: string; metric_id: string; platform: string; body: string; link: string; source_url: string };

function compose(m: Metric, platform: (typeof PLATFORMS)[number], lead: string, campaign: string): DraftPost {
  const link = tagLink(`/explained/${m.id}`, platform, campaign);
  const parts = [`${lead}${m.title}: ${m.value}${m.period ? ` (${m.period})` : ""}.`, `Source: ${m.source}.`, link];
  let body = parts.join("\n\n");
  if (body.length > LIMIT[platform]) body = [parts[0]!, link].join("\n\n");
  return { kind: campaign, metric_id: m.id, platform, body, link, source_url: m.sourceUrl };
}

/** Pick one figure of the day, rotating by date, from live figures with a value and period. */
export function figureOfDay(metrics: Metric[], date = new Date()): DraftPost[] {
  const live = metrics.filter((m) => m.status === "ok" && m.value && m.period && /^https:\/\//.test(m.sourceUrl));
  if (!live.length) return [];
  const day = Math.floor(date.getTime() / 86400_000);
  const m = live[day % live.length]!;
  return PLATFORMS.map((p) => compose(m, p, "UK figure of the day — ", "figure_of_day"));
}

/** Figures whose announced next release falls in the next 36 hours. */
export function releaseDay(metrics: Metric[], now = Date.now()): DraftPost[] {
  const out: DraftPost[] = [];
  for (const m of metrics) {
    if (m.status !== "ok" || !m.value || !m.nextDue) continue;
    const due = Date.parse(m.nextDue);
    if (Number.isNaN(due) || due < now || due - now > 36 * 3600_000) continue;
    const when = new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" });
    for (const p of PLATFORMS) out.push(compose(m, p, `New figures due ${when}. Latest published — `, "release_day"));
    if (out.length >= 6) break;
  }
  return out;
}

/** One figure of the day for a country register, rotating by date. Figures are copied verbatim. */
export function countryFigureOfDay(payload: CountryPayload, date = new Date()): DraftPost[] {
  const live = payload.metrics.filter((m) => m.status === "ok" && m.value && m.period && /^https:\/\//.test(m.sourceUrl));
  if (!live.length) return [];
  const day = Math.floor(date.getTime() / 86400_000);
  const m = live[day % live.length]!;
  const lead = `${payload.country.name} figure of the day — `;
  return PLATFORMS.map((p) => {
    const link = tagLink(`/${payload.country.code}/explained/${m.id}`, p, "country_figure_of_day");
    const parts = [`${lead}${m.title}: ${m.value}${m.period ? ` (${m.period})` : ""}.`, `Source: ${m.source}.`, link];
    let body = parts.join("\n\n");
    if (body.length > LIMIT[p]) body = [parts[0]!, link].join("\n\n");
    return { kind: "country_figure_of_day", metric_id: `${payload.country.code}:${m.id}`, platform: p, body, link, source_url: m.sourceUrl };
  });
}
