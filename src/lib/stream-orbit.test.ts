import { describe, expect, it } from "vitest";
import { countUp, sceneFor } from "./stream-orbit";
import type { Segment } from "./stream-rundown";

const seg = (id: string, cards = 1) => ({ id, title: "", country: "united kingdom", topic: id, layers: { fl: false, mg: false, nw: false }, cards: Array(cards).fill({}), headlines: [] }) as unknown as Segment;

describe("sceneFor", () => {
  it("maps segments to scenes", () => {
    expect(sceneFor(seg("warnings", 0))).toBe("warnings");
    expect(sceneFor(seg("news", 0))).toBe("headlines");
    expect(sceneFor(seg("weather"))).toBe("weather");
    expect(sceneFor(seg("flights"))).toBe("flights");
    expect(sceneFor(seg("boats"))).toBe("migration");
    expect(sceneFor(seg("country-france"))).toBe("world");
    expect(sceneFor(seg("economy"))).toBe("stats");
  });
});

describe("countUp", () => {
  it("ends on the exact published value", () => {
    for (const v of ["£2.81tn", "1,234,567", "3.4%", "41,472 people", "Not published"]) expect(countUp(v, 1)).toBe(v);
  });
  it("keeps format while counting", () => {
    expect(countUp("1,000", 0)).toBe("0");
    expect(countUp("£2.81tn", 0)).toBe("£0.00tn");
  });
  it("leaves text without a number untouched", () => {
    expect(countUp("Amber", 0.3)).toBe("Amber");
  });
});
