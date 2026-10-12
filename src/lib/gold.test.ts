import { describe, expect, it } from "vitest";
import { parseImfGold, OZ_PER_TONNE } from "./gold";
import { agencyGroups, AGENCIES } from "./agencies";
import { COUNTRIES } from "./countries";
import { CATEGORIES } from "./uk-stats";

const H = "DATAFLOW,COUNTRY,INDICATOR,SECTOR,FREQUENCY,TIME_PERIOD,OBS_VALUE";
const row = (c: string, s: string, p: string, v: string) => `IMF.STA:IRFCL(12.0.0),${c},IRFCLDT1_IRFCL56V_FTO,${s},M,${p},${v}`;

describe("parseImfGold", () => {
  const csv = [H,
    row("USA", "S1XS1311", "2026-M07", "261499000"),
    row("GBR", "S1X", "2026-M09", "0"),
    row("GBR", "S1XS1311", "2026-M08", "9976041.279"),
    row("GBR", "S1XS1311", "2026-M09", "9976041.279"),
    row("G163", "S1XS1311", "2026-M08", "347000000"),
    row("BRA", "S1XS1311", "2026-M09", "5544278722.99"),
  ].join("\n");
  const t = parseImfGold(csv)!;

  it("converts ounces to tonnes and ranks the largest first", () => {
    expect(t.ranked.map((r) => r.iso3)).toEqual(["USA", "GBR"]);
    expect(t.ranked[0]!.tonnes).toBeCloseTo(261499000 / OZ_PER_TONNE, 3);
    expect(Math.round(t.ranked[0]!.tonnes)).toBe(8134);
  });
  it("uses the combined sector and the latest month", () => {
    expect(t.ranked[1]!.period).toBe("2026-M09");
    expect(Math.round(t.ranked[1]!.tonnes)).toBe(310);
  });
  it("drops aggregates like the euro area", () => {
    expect(t.ranked.some((r) => r.iso3 === "G163")).toBe(false);
  });
  it("never ranks an implausible filing", () => {
    expect(t.flagged.map((r) => r.iso3)).toEqual(["BRA"]);
  });
  it("returns nothing for a non-CSV reply", () => {
    expect(parseImfGold("<error/>")).toBeNull();
  });
});

describe("agency directory", () => {
  it("covers every country", () => {
    for (const c of COUNTRIES) expect(AGENCIES[c.code], c.code).toBeDefined();
  });
  it("lists every UK category for every country", () => {
    for (const c of COUNTRIES) expect(agencyGroups(c.code).map((g) => g.category)).toEqual(CATEGORIES);
  });
  it("only links https or http government pages", () => {
    for (const rows of Object.values(AGENCIES)) for (const r of rows) if (!r.office) expect(r.url).toMatch(/^https?:\/\//);
  });
});
