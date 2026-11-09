import { describe, expect, it } from "vitest";
import { checkedLabel, keyFigures, publisherTag } from "./stream-extras";
import type { Metric } from "./uk-stats";

const m = (id: string, title: string, value: string | null, source = "ONS · PSF"): Metric => ({
  id, title, value, source, category: "Finance", sourceUrl: "", sub: null, period: "Sep 2026", asOf: null, nextDue: null,
  cadence: "", change: null, spark: [], status: value ? "ok" : "unavailable", note: null,
} as Metric);

describe("orbit key figures", () => {
  it("skips a figure that is not published instead of showing 0", () => {
    const out = keyFigures([m("uk-national-debt", "Debt", null), m("uk-cpi", "CPI", "3.8%")]);
    expect(out.map((x) => x.id)).toEqual(["uk-cpi"]);
  });
  it("shows the debt figure exactly as filed", () => {
    expect(keyFigures([m("uk-national-debt", "Debt", "£3,005bn")])[0]!.value).toBe("£3,005bn");
  });
  it("caps the rail at four cards", () => {
    const all = [m("uk-national-debt", "D", "1"), m("x", "Small boats arrivals 2026 so far", "2", "Home Office"), m("uk-cpi", "C", "3"),
      m("uk-metoffice-warnings", "W", "Yellow", "Met Office · NSWWS"), m("uk-threat-level", "T", "Substantial", "MI5 / JTAC via GOV.UK")];
    expect(keyFigures(all)).toHaveLength(4);
  });
  it("tags the publisher from the source line", () => {
    expect(publisherTag("Met Office · NSWWS")).toBe("Met Office");
    expect(publisherTag("MI5 / JTAC via GOV.UK")).toBe("MI5 / JTAC");
  });
  it("says checked today only on the same London day", () => {
    expect(checkedLabel("2026-11-09T10:00:00Z", new Date("2026-11-09T22:00:00Z"))).toBe("Checked today");
    expect(checkedLabel("2026-11-08T10:00:00Z", new Date("2026-11-09T22:00:00Z"))).not.toBe("Checked today");
    expect(checkedLabel(null, new Date())).toBeNull();
  });
});
