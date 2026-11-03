import { describe, expect, it } from "vitest";
import { PREPAREDNESS } from "./preparedness.data";
import { filterPreparedness } from "./preparedness";

const OFFICIAL = [/\.gov\.uk$/, /^www\.mcf\.se$/, /^www\.suomi\.fi$/, /^www\.ready\.gov$/, /^www\.canada\.ca$/, /\.govt\.nz$/];

describe("preparedness advice", () => {
  it("only links official government hosts over https", () => {
    for (const a of PREPAREDNESS) {
      const u = new URL(a.url);
      expect(u.protocol).toBe("https:");
      expect(OFFICIAL.some(r => r.test(u.hostname))).toBe(true);
    }
  });
  it("has a non-empty quote and keeps unknown dates null", () => {
    for (const a of PREPAREDNESS) {
      expect(a.quote.trim().length).toBeGreaterThan(10);
      expect(a.published).toBeNull();
    }
  });
  it("lists the UK first with 3 days and 3 litres", () => {
    const uk = PREPAREDNESS[0]!;
    expect(uk.code).toBe("GB");
    expect(uk.days).toBe(3);
    expect(uk.waterLitresPerPersonPerDay).toBe(3);
  });
  it("filters by region and search", () => {
    expect(filterPreparedness("Europe", "").map(a => a.code)).toEqual(["SE", "FI"]);
    expect(filterPreparedness("all", "canada").map(a => a.code)).toEqual(["CA"]);
  });
});
