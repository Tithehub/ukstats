import { describe, expect, it } from "vitest";
import { topSix } from "./stream-extras";
import type { WorldPayload } from "./world";

const world = { countries: [], updated: {}, fetchedAt: "", values: { "NY.GDP.PCAP.CD": { GBR: { value: 50000, year: 2024 } } } } as unknown as WorldPayload;
const boats = { days: [{ date: "2026-11-01", arrivals: 300, boats: 6 }, { date: "2026-11-03", arrivals: 412, boats: 7 }] };

describe("topSix", () => {
  it("puts irregular migration & small boats first, six boxes total", () => {
    const b = topSix(world, "GBR", boats, true);
    expect(b).toHaveLength(6);
    expect(b[0]!.id).toBe("migration");
  });
  it("UK uses the latest Home Office day", () => {
    const b = topSix(world, "GBR", boats, true)[0]!;
    expect(b.value).toBe("412 people");
    expect(b.when).toBe("7 boats · 03 Nov 2026");
  });
  it("non-UK countries show no small-boats figure", () => {
    expect(topSix(world, "FRA", boats, false)[0]!.value).toBeNull();
  });
  it("missing World Bank values are not published, present ones are shown", () => {
    const b = topSix(world, "GBR", boats, true);
    expect(b[1]!.value).not.toBeNull();
    expect(b[1]!.when).toBe("2024");
    expect(b[2]!.value).toBeNull();
  });
});
