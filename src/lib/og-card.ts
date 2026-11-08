/** Pure text for the 1200×630 share card. Never invents a figure: missing values read "Not published". */
export interface OgFigure {
  title: string;
  value: string | null;
  period: string | null;
  source: string | null;
  asOf: string | null;
}

export interface OgCardText {
  title: string;
  value: string;
  missing: boolean;
  sourceLine: string;
  periodLine: string;
  dateLine: string | null;
}

/** Page keys that share a page's headline figure. */
export const OG_PAGE_METRIC: Record<string, string> = {
  home: "uk-national-debt",
  "small-boats": "uk-small-boats-week",
  "foreign-aid": "uk-foreign-aid",
};

/** Pages with no single figure: a title card only. */
export const OG_TITLE_PAGES: Record<string, { title: string; subtitle: string }> = {
  spending: { title: "Council spending: where the money goes", subtitle: "Each council's own published return, never summed" },
  daily: { title: "UKStats daily briefing", subtitle: "Every official figure that changed today" },
};

const fmtDay = (iso: string): string | null => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
};

export function ogCardText(f: OgFigure): OgCardText {
  const v = (f.value ?? "").trim();
  const missing = !v || /not published/i.test(v);
  return {
    title: f.title.trim() || "Official UK statistic",
    value: missing ? "Not published" : v,
    missing,
    sourceLine: `Source: ${(f.source ?? "").trim() || "Not published"}`,
    periodLine: `Period: ${(f.period ?? "").trim() || "Not published"}`,
    dateLine: f.asOf ? (fmtDay(f.asOf) ? `Updated ${fmtDay(f.asOf)}` : null) : null,
  };
}

/** Absolute share-image URL for a key (metric id, page key, or country:code:metric). */
export function ogImageUrl(origin: string, key: string): string {
  return `${origin}/api/public/og/${encodeURIComponent(key)}.png`;
}

export function ogImageMeta(origin: string, key: string, alt: string) {
  const url = ogImageUrl(origin, key);
  return [
    { property: "og:image", content: url },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt },
    { name: "twitter:image", content: url },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
