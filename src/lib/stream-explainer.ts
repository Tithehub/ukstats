// "About UKStats" hourly explainer: pure chapter plan and presenter script.
// Prices come only from the existing price lists — never typed into the script.
import { REPORT_PRICES } from "@/lib/reports";
import { PRODUCT_PRICES, AI_PRESENTER_PENCE, gbp as rentGbp } from "@/lib/rent-pricing";

const gbp = (p: number) => `£${(p / 100).toFixed(2)}`;

export type ChapterId = "welcome" | "globe" | "sources" | "reports" | "rent" | "sports" | "close";
export interface Chapter { id: ChapterId; title: string; ms: number; lines: string[]; countries?: string[] }

export function explainerChapters(): Chapter[] {
  const r = REPORT_PRICES;
  return [
    { id: "welcome", title: "Welcome to UKStats", ms: 15_000, lines: [
      "Time for a quick tour of UKStats — one source of truth for official UK and world statistics.",
      "Every figure is free for everyone, at ukstats.co.uk.",
    ] },
    { id: "globe", title: "The interactive globe", ms: 40_000, countries: ["united kingdom", "united states", "france", "australia"], lines: [
      "This is our live interactive globe. Pick any country and it flies straight there.",
      "Switch on government travel advice from the UK Foreign Office and the US State Department, each on its own scale.",
      "Add live flights, migration routes and news reports — every layer is labelled with who published it.",
      "Try it yourself at ukstats.co.uk slash globe.",
    ] },
    { id: "sources", title: "Where our stats come from", ms: 30_000, lines: [
      "Our figures come straight from official publishers: the ONS, the Home Office, the Treasury and the OBR, the Met Office, UKHSA, Eurostat, the World Bank and the IMF.",
      "Every figure shows its source, its date and when the next release is due.",
      "Nothing is estimated and nothing is made up. If a figure isn't published, we say so.",
    ] },
    { id: "reports", title: "Daily PDF reports", ms: 30_000, lines: [
      `Want it all in one document? Download the daily UK report for ${gbp(r.report_uk_daily.pence)}, or the Global report for ${gbp(r.report_global_daily.pence)}.`,
      `Subscribe for ${gbp(r.report_uk_monthly.pence)} a month or ${gbp(r.report_uk_yearly.pence)} a year for the UK, or ${gbp(r.report_global_monthly.pence)} a month or ${gbp(r.report_global_yearly.pence)} a year for Global.`,
      "Each report includes government warnings, headlines and emergency kit guidance. Scan the code to get today's edition.",
    ] },
    { id: "rent", title: "Rent and brand your own stats site", ms: 30_000, lines: [
      "Run a business, a channel or a community? Put your own brand on our official stats.",
      `Branded widgets from ${rentGbp(PRODUCT_PRICES.widgets.pence)} a month, a branded dashboard from ${rentGbp(PRODUCT_PRICES.dashboard.pence)}, and your own live stream from ${rentGbp(PRODUCT_PRICES.stream.pence)}.`,
      `Present it yourself, or add our AI presenter for ${rentGbp(AI_PRESENTER_PENCE)} a month. You change the branding — never the figures. See ukstats.co.uk slash rent.`,
    ] },
    { id: "sports", title: "Coming soon: sports", ms: 15_000, lines: [
      "Coming soon to UKStats: sports data and stats — with free games to play.",
    ] },
    { id: "close", title: "Thanks for watching", ms: 10_000, lines: [
      "Follow us at UKStats Global, share the stream, and now — back to the figures.",
    ] },
  ];
}

export const EXPLAINER_MS = explainerChapters().reduce((a, c) => a + c.ms, 0);

/** Which chapter and line the explainer is on, msIn into the explainer. */
export function explainerStep(msIn: number) {
  const ch = explainerChapters();
  let t = Math.max(0, Math.min(msIn, EXPLAINER_MS - 1));
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i]!;
    if (t < c.ms) {
      const line = Math.min(c.lines.length - 1, Math.floor(t / (c.ms / c.lines.length)));
      const country = c.countries ? c.countries[Math.min(c.countries.length - 1, Math.floor(t / (c.ms / c.countries.length)))]! : null;
      return { index: i, chapter: c, msInChapter: t, line, country };
    }
    t -= c.ms;
  }
  const c = ch.at(-1)!;
  return { index: ch.length - 1, chapter: c, msInChapter: c.ms - 1, line: c.lines.length - 1, country: null };
}
