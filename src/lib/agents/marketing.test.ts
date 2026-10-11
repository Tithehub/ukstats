// The site's core rule: posts carry official statistics only. Weather-model and
// warning-feed cards stay on the site (labelled as such) but must never be posted.
import { describe, expect, it } from "vitest";
import { countryFigureOfDay, figureOfDay } from "./marketing";
import type { CountryPayload } from "../countries";
import type { Metric } from "../uk-stats";

const weather = {
  id: "ie-temp-30d",
  title: "Dublin temperature, 30-day mean",
  value: "14.9°C",
  period: "2026-09-09",
  asOf: "2026-10-11T00:00:00Z",
  cadence: "Daily",
  source: "Open-Meteo weather model (not an official statistic)",
  sourceUrl: "https://open-meteo.com",
  spark: [14, 15],
  raw: 14.9,
  note: "A weather model, not an official statistic.",
  status: "ok",
};

const official = {
  id: "ie-debt",
  title: "Government debt (% of GDP)",
  value: "64.4%",
  period: "2026-Q1",
  asOf: "2026-10-01",
  cadence: "Quarterly",
  source: "Eurostat",
  sourceUrl: "https://ec.europa.eu/eurostat",
  spark: [63, 64],
  raw: 64.4,
  note: null,
  status: "ok",
};

const payload = {
  country: { code: "ie", name: "Ireland", eurostat: "IE", office: "CSO", officeUrl: "https://www.cso.ie", euro: true, wave: 1 },
  metrics: [weather, official],
  fetchedAt: "2026-10-11T23:00:00Z",
} as unknown as CountryPayload;

describe("marketing picks official figures only", () => {
  it("drafts the Eurostat figure, never the weather model", () => {
    const posts = countryFigureOfDay(payload, new Date("2026-10-11T12:00:00Z"));
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      expect(p.body).toContain("Government debt");
      expect(p.body).not.toMatch(/not an official statistic|temperature/i);
      expect(p.link).toContain("ukstats.co.uk/ie/explained/ie-debt");
    }
  });

  it("writes no country post at all when only a model figure is live", () => {
    const onlyModel = { ...payload, metrics: [weather] } as unknown as CountryPayload;
    expect(countryFigureOfDay(onlyModel, new Date("2026-10-11T12:00:00Z"))).toEqual([]);
  });

  it("writes no UK post when only a model figure is live", () => {
    expect(figureOfDay([weather as unknown as Metric], new Date("2026-10-11T12:00:00Z"))).toEqual([]);
  });
});
