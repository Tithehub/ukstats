// "About UKStats" hourly explainer: pure chapter plan and presenter script.
// Prices come only from the existing price lists — never typed into the script.
import { REPORT_PRICES } from "@/lib/reports";
import { lineMs as spokenMs } from "@/lib/stream-script";
import { PRODUCT_PRICES, AI_PRESENTER_PENCE, gbp as rentGbp } from "@/lib/rent-pricing";

import { gbp } from "@/lib/reports";

export type ChapterId = "welcome" | "globe" | "sources" | "reports" | "rent" | "sports" | "walkthrough" | "close";
/** lineMs: time on air per line, measured from the presenter voice plus a short pause, so no line is cut off. */
export interface Chapter { id: ChapterId; title: string; ms: number; lines: string[]; lineMs: number[]; countries?: string[] }
type Draft = Omit<Chapter, "ms">;

/** Said over the globe when no public camera has real live video, instead of the camera line. */
export const GLOBE_NO_CAM_LINE = "Try it yourself at ukstats dot co dot uk slash globe. Every layer is labelled with its source.";

export function explainerChapters(): Chapter[] {
  const r = REPORT_PRICES;
  const drafts: Draft[] = [
    { id: "welcome", title: "Welcome to UKStats", lineMs: [8900, 7220], lines: [
      "Time for a quick tour of UKStats — one source of truth for official UK and world statistics.",
      "Every figure is free for everyone, at ukstats.co.uk.",
    ] },
    { id: "globe", title: "The interactive globe", lineMs: [10180, 9300, 10620, 11220, 7780, 12700], lines: [
      "This is our real interactive globe. First, the UK Foreign Office's travel advice for every country, on its own scale.",
      "Next, the US State Department's levels one to four — shown separately, never merged with the UK's.",
      "Live flights, from public tracking feeds. They're not official, and colours change only for emergency codes or travel warnings.",
      "Migration routes: Home Office small boats, Frontex, US Border Patrol and the UN refugee agency, side by side.",
      "News and police reports, shown as headlines, kept apart from official warnings.",
      "And public road cameras run by transport authorities — live scenes only, never figures. Try it at ukstats.co.uk slash globe.",
    ] },
    { id: "sources", title: "Where our stats come from", lineMs: [15900, 6700, 7900], lines: [
      "Our figures come straight from official publishers: the ONS, the Home Office, the Treasury and the OBR, the Met Office, UKHSA, Eurostat, the World Bank and the IMF.",
      "Every figure shows its source, its date and when the next release is due.",
      "Nothing is estimated and nothing is made up. If a figure isn't published, we say so.",
    ] },
    { id: "reports", title: "Daily PDF reports", lineMs: [9660, 15140, 9460], lines: [
      `Want it all in one document? The UK and Global Stats report is ${gbp(r.report_combined_daily.pence)} a day.`,
      `Or subscribe for ${gbp(r.report_combined_weekly.pence)} a week, ${gbp(r.report_combined_monthly.pence)} a month or ${gbp(r.report_combined_yearly.pence)} a year.`,
      "It opens with UK debt and every UK figure, then global stats. Scan the code to get today's edition.",
    ] },
    { id: "rent", title: "Rent and brand your own stats site", lineMs: [8380, 11460, 14260], lines: [
      "Run a business, a channel or a community? Put your own brand on our official stats.",
      `Branded widgets from ${rentGbp(PRODUCT_PRICES.widgets.pence)} a month, a branded dashboard from ${rentGbp(PRODUCT_PRICES.dashboard.pence)}, and your own live stream from ${rentGbp(PRODUCT_PRICES.stream.pence)}.`,
      `Present it yourself, or add our AI presenter for ${rentGbp(AI_PRESENTER_PENCE)} a month. You change the branding — never the figures. See ukstats.co.uk slash rent.`,
    ] },
    { id: "sports", title: "Coming soon: sports", lineMs: [7700], lines: [
      "Coming soon to UKStats: sports data and stats — with free games to play.",
    ] },
    // Site walkthrough video (light mode); lineMs follow its page cuts: home, globe, statistics, reports, rent.
    { id: "walkthrough", title: "A quick look around the site", lineMs: [13650, 12950, 9150, 9450, 9450], lines: [
      "Here's ukstats dot co dot uk. The latest official figures are right on the home page, each with its source and date.",
      "Open the interactive globe for government travel warnings, flights and migration routes, and turn layers on in the Layers menu.",
      "On the statistics page, search any figure, like small boats, and filter by topic.",
      `Reports has the daily UK and Global Stats PDF, from ${gbp(r.report_combined_daily.pence)} a day.`,
      "And Rent UKStats puts your own brand on the very same official figures.",
    ] },
    { id: "close", title: "Thanks for watching", lineMs: [7540], lines: [
      "Follow us at UKStats Global, share the stream, and now — back to the figures.",
    ] },
  ];
  // Each line lasts at least as long as she takes to say it; the walkthrough keeps its video cut times (its lines are checked to fit).
  return drafts.map((c) => { const lm = c.id === "walkthrough" ? c.lineMs : c.lines.map((l, i) => Math.max(c.lineMs[i]!, spokenMs(l))); return { ...c, lineMs: lm, ms: lm.reduce((a, b) => a + b, 0) }; });
}

export const EXPLAINER_MS = explainerChapters().reduce((a, c) => a + c.ms, 0);

/** Which chapter and line the explainer is on, msIn into the explainer. */
export function explainerStep(msIn: number) {
  const ch = explainerChapters();
  let t = Math.max(0, Math.min(msIn, EXPLAINER_MS - 1));
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i]!;
    if (t < c.ms) {
      let line = 0, acc = c.lineMs[0]!;
      while (line < c.lines.length - 1 && t >= acc) acc += c.lineMs[++line]!;
      const country = c.countries ? c.countries[Math.min(c.countries.length - 1, Math.floor(t / (c.ms / c.countries.length)))]! : null;
      return { index: i, chapter: c, msInChapter: t, line, country };
    }
    t -= c.ms;
  }
  const c = ch.at(-1)!;
  return { index: ch.length - 1, chapter: c, msInChapter: c.ms - 1, line: c.lines.length - 1, country: null };
}

/** Real-globe tour for the globe chapter: one layer per presenter line; the last step opens a live camera. */
export type TourStep = { key: "uk" | "us" | "flights" | "migration" | "news" | "cams"; label: string; state: { layer?: "uk" | "us"; fl: boolean; mg: boolean; nw: boolean; cam?: boolean; c: string } };
export const GLOBE_TOUR: TourStep[] = [
  { key: "uk", label: "UK FCDO travel advice", state: { layer: "uk", fl: false, mg: false, nw: false, c: "united kingdom" } },
  { key: "us", label: "US State Dept levels 1–4", state: { layer: "us", fl: false, mg: false, nw: false, c: "united states" } },
  { key: "flights", label: "Live flights · not official", state: { fl: true, mg: false, nw: false, c: "united kingdom" } },
  { key: "migration", label: "Migration routes", state: { fl: false, mg: true, nw: false, c: "united kingdom" } },
  { key: "news", label: "News & police reports", state: { fl: false, mg: false, nw: true, c: "united kingdom" } },
  { key: "cams", label: "Public road cameras · scene only", state: { fl: false, mg: false, nw: false, cam: true, c: "united states" } },
];
/** Tour step for a globe-chapter line; without a live camera the tour stays on the news step instead of showing stills as live. */
export function globeTourStep(line: number, hasLiveCam: boolean): number {
  const i = Math.max(0, Math.min(GLOBE_TOUR.length - 1, line));
  return GLOBE_TOUR[i]!.key === "cams" && !hasLiveCam ? i - 1 : i;
}
