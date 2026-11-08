import { describe, expect, it } from "vitest";
import { compare, factorPositions, parseWellbeingCsv, PRESET_WEIGHTS, rankByMeasure, UNOFFICIAL_LABEL, type Place } from "./places";

const HEAD = "v4_3,Data marking,Lower limit,Upper limit,yyyy-yy,Time,administrative-geography,Geography,measure-of-wellbeing,MeasureOfWellbeing,wellbeing-estimate,Estimate";
const row = (v: string, mark: string, t: string, code: string, name: string, m: string) => `${v},${mark},,,${t},${t},${code},"${name}",${m},x,average-mean,Average (mean)`;

const place = (code: string, over: Partial<Place>): Place => ({ code, name: code, nation: "England", wellbeing: null, crimeRate: null, housePrice: null, weeklyPay: null, over65Share: null, goodSchoolsShare: null, ...over });

describe("wellbeing parser", () => {
  const csv = [HEAD,
    row("7.5", "", "2022-23", "E06000001", "Hartlepool", "happiness"),
    row("", "[u]", "2022-23", "E07000073", "Harlow", "happiness"),
    row("9.9", "", "2021-22", "E07000073", "Harlow", "happiness"),
    row("7.1", "", "2022-23", "E12000001", "North East", "happiness"),
    row("3.2", "", "2022-23", "S12000036", "Edinburgh, City of", "anxiety"),
  ].join("\n");
  const t = parseWellbeingCsv(csv);
  it("keeps only the latest period and local authorities", () => {
    expect(t.period).toBe("2022-23");
    expect(t.rows.has("E12000001")).toBe(false);
    expect(t.rows.get("S12000036")?.name).toBe("Edinburgh, City of");
  });
  it("never fills an ONS-suppressed estimate from another year", () => {
    expect(t.rows.get("E07000073")?.wb.happiness).toBeNull();
  });
});

describe("ranking", () => {
  const wb = (h: number | null, a: number | null) => ({ lifeSatisfaction: null, happiness: h, worthwhile: null, anxiety: a });
  const ps = [place("A", { wellbeing: wb(7, 3.5) }), place("B", { wellbeing: wb(8, 2.5) }), place("C", { wellbeing: wb(null, null) })];
  it("does not rank places without a published value", () => {
    expect(rankByMeasure(ps, "happiness", true).map((p) => p.code)).toEqual(["B", "A"]);
  });
  it("treats lower anxiety as better", () => {
    expect(rankByMeasure(ps, "anxiety", true)[0]!.code).toBe("B");
  });
});

describe("unofficial comparison", () => {
  it("household presets each add up to 100%", () => {
    for (const w of Object.values(PRESET_WEIGHTS)) expect(Object.values(w).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("drops a factor missing for one place from both scores", () => {
    const ps = [place("A", { crimeRate: 50, weeklyPay: 600 }), place("B", { crimeRate: 80, weeklyPay: 700 }), place("C", { crimeRate: null, weeklyPay: 800 })];
    const pos = factorPositions(ps);
    const r = compare(pos.get("A")!, pos.get("C")!, { ...PRESET_WEIGHTS.single });
    expect(r.dropped).toContain("safety");
    expect(r.used).toEqual(["pay"]);
    expect(r.from.score).toBe(0);
    expect(r.to.score).toBe(100);
  });
  it("always carries the unofficial label", () => {
    const pos = factorPositions([place("A", {}), place("B", {})]);
    expect(compare(pos.get("A")!, pos.get("B")!, PRESET_WEIGHTS.couple).label).toBe(UNOFFICIAL_LABEL);
  });
});
