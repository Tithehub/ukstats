// The daily statement. Every sentence is assembled from figures a body has
// already published: the templates frame a number, they never invent, round,
// re-base or characterise one.

export interface DailyFigure {
  metricId: string;
  title: string;
  category: string;
  value: string;
  previousValue: string | null;
  period: string | null;
  asOf: string | null;
  source: string;
  sourceUrl: string;
  /** "changed" when the figure moved today, "vital" when it is a pinned headline. */
  role: "changed" | "vital";
  hasHistory: boolean;
}

export interface DailyBriefing {
  date: string;
  headline: string;
  body: string;
  figures: DailyFigure[];
  changeCount: number;
}

/** London-day key, e.g. "2026-09-03". The register's day boundary is UK time. */
export function londonDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** "3 September 2026" from an ISO date, without shifting the day. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function periodClause(period: string | null): string {
  return period ? `, covering ${period},` : "";
}

/** One paragraph for a figure that moved today. */
function changedParagraph(f: DailyFigure): string {
  const period = f.period ? ` for ${f.period}` : "";
  const prev = f.previousValue ? ` The previous published figure was ${f.previousValue}.` : "";
  const asOf = f.asOf ? ` Release dated ${longDate(f.asOf.slice(0, 10))}.` : "";
  return `${f.title} (${f.category}) was published at ${f.value}${period}, by ${f.source}.${prev}${asOf}`;
}

/** One line for a pinned vital sign in the closing round-up. */
function vitalLine(f: DailyFigure): string {
  return `${f.title}: ${f.value}${f.period ? ` (${f.period})` : ""} — ${f.source}.`;
}

/**
 * Compose the day's written statement from the figures supplied. Deterministic:
 * the same figures always produce the same words.
 */
export function composeBriefing(dateIso: string, figures: DailyFigure[]): DailyBriefing {
  const changed = figures.filter((f) => f.role === "changed");
  const vitals = figures.filter((f) => f.role === "vital");
  const label = longDate(dateIso);

  const headline =
    changed.length === 0
      ? `${label}: no new official UK figures published`
      : `${label}: ${plural(changed.length, "official UK figure")} published`;

  const opening =
    changed.length === 0
      ? `On ${label}, no figure on the register was republished by its issuing body. ` +
        `Everything below is the most recent published value, unchanged from the previous day.`
      : `On ${label}, ${plural(changed.length, "figure")} on the register ${
          changed.length === 1 ? "was" : "were"
        } republished by ${
          new Set(changed.map((c) => c.source)).size === 1
            ? changed[0]!.source
            : `${new Set(changed.map((c) => c.source)).size} issuing bodies`
        }. Each is reproduced exactly as published${periodClause(changed[0]?.period ?? null)} with a link to the original release.`;

  const changeBlock = changed.length
    ? [`What was published`, ...changed.map((f) => `• ${changedParagraph(f)}`)].join("\n")
    : "";

  const vitalBlock = vitals.length
    ? [
        `Where things stand`,
        ...vitals.map((f) => `• ${vitalLine(f)}`),
      ].join("\n")
    : "";

  const closing =
    `Every figure in this statement is the value its issuing body published, with the reference period it published. ` +
    `Nothing here is estimated, modelled, interpolated or projected.`;

  const body = [opening, changeBlock, vitalBlock, closing].filter(Boolean).join("\n\n");

  return { date: dateIso, headline, body, figures, changeCount: changed.length };
}

/** Short one-line summary used for cards, feeds and social previews. */
export function briefingSummary(b: { changeCount: number; figures: DailyFigure[] }): string {
  const vitals = b.figures.filter((f) => f.role === "vital").slice(0, 3);
  const lead =
    b.changeCount === 0
      ? "No new official figures published."
      : `${plural(b.changeCount, "official figure")} published.`;
  return vitals.length ? `${lead} ${vitals.map((v) => `${v.title} ${v.value}`).join("; ")}.` : lead;
}

export function briefingCsv(b: { date: string; figures: DailyFigure[] }): string {
  const q = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return [
    "Date,Figure,Category,Value,Previous value,Period,Published,Source,Source URL,Role",
    ...b.figures.map((f) =>
      [
        b.date,
        q(f.title),
        q(f.category),
        q(f.value),
        q(f.previousValue),
        q(f.period),
        q(f.asOf),
        q(f.source),
        q(f.sourceUrl),
        f.role,
      ].join(","),
    ),
  ].join("\n");
}

/** Plain-text version for copying, with the sources appended. */
export function briefingText(b: { headline: string; body: string; figures: DailyFigure[] }, url: string): string {
  const sources = Array.from(new Map(b.figures.map((f) => [f.sourceUrl, f.source])).entries()).map(
    ([u, s]) => `${s}: ${u}`,
  );
  return `${b.headline}\n\n${b.body}\n\nSources\n${sources.join("\n")}\n\n${url}`;
}
