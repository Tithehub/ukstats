import { describe, expect, it } from "vitest";
import { ogCardText, ogImageUrl } from "./og-card";

describe("share card text", () => {
  it("shows Not published when the value is missing", () => {
    const t = ogCardText({ title: "Debt", value: null, period: null, source: null, asOf: null });
    expect(t.value).toBe("Not published");
    expect(t.missing).toBe(true);
  });
  it("always carries the source and period", () => {
    const t = ogCardText({ title: "UK public sector net debt", value: "£3,005bn", period: "2026 SEP", source: "Office for National Statistics", asOf: "2026-10-20T23:00:00Z" });
    expect(t.value).toBe("£3,005bn");
    expect(t.sourceLine).toBe("Source: Office for National Statistics");
    expect(t.periodLine).toBe("Period: 2026 SEP");
    expect(t.dateLine).toBe("Updated 21 October 2026");
  });
  it("builds an absolute PNG URL", () => {
    expect(ogImageUrl("https://ukstats.co.uk", "uk-cpi")).toBe("https://ukstats.co.uk/api/public/og/uk-cpi.png");
  });
});
