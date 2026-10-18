/** Pure rules for the nightly improvement plan (browser-safe, testable). */
export type PlanTask = {
  title: string;
  why: string;
  evidence: string;
  size: "small" | "medium" | "large";
  success_check: string;
  needs_user: string | null;
  status: "pending" | "approved" | "skipped";
};

export const MAX_TASKS = 10;

/** Open roadmap items the planner may draw on (kept in code; the live site can't read roadmap.md). */
export const OPEN_ROADMAP = [
  "Expand world rankings coverage and add a 2–3 country side-by-side comparison",
  "IMF/OECD/UN sources and country pages brought up to UK standard",
  "Postcode / local area search (Police.uk, Land Registry, NHS waits)",
  "Social share image cards for every figure",
  "Most-asked-questions answer pages with the verified figure first",
  "Daily small-boats email alert (needs a sender address from the owner)",
  "Submit sitemap in Google Search Console (needs the owner's Google account)",
  "Performance: keep every page under 1s on repeat visits",
];

const BANNED: RegExp[] = [
  /\b(estimat|interpolat|invent|fabricat|projected figure|guess)/i,
  /\b(change|edit|adjust|correct|override)\b[^.]{0,30}\b(figure|value|number|stat)/i,
  /\bauto[- ]?post|automatic(ally)? post|schedule[d]? post/i,
  /\b(re-?enable|resume|turn (back )?on|reopen)\b[^.]{0,30}\b(donation|payment|checkout|crypto)/i,
  /\bsponsor\w*\b[^.]{0,40}\b(beside|next to|on) (the )?(figure|card|number|embed|widget)/i,
];

export function isAllowedTask(t: Pick<PlanTask, "title" | "why">): boolean {
  const text = `${t.title}. ${t.why}`;
  return !BANNED.some((r) => r.test(text));
}

export function cleanPlan(raw: Omit<PlanTask, "status">[]): PlanTask[] {
  return raw
    .filter(isAllowedTask)
    .slice(0, MAX_TASKS)
    .map((t) => ({ ...t, title: t.title.replace(/^\s*\d+[.)]\s*/, ""), needs_user: t.needs_user?.trim() ? t.needs_user : null, status: "pending" as const }));
}

export function buildRequest(tasks: PlanTask[]): string {
  const ok = tasks.filter((t) => t.status === "approved");
  if (!ok.length) return "";
  return [
    "Please build these approved improvements from this morning's agent plan:",
    ...ok.map((t, i) => `${i + 1}. ${t.title} — ${t.why} (done when: ${t.success_check})`),
  ].join("\n");
}
