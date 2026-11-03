import { describe, expect, it } from "vitest";
import { boatIcons, buildFlows, mapName, parseCbp, parseFrontex, parseUnhcr } from "./migration-flows";

describe("migration flows", () => {
  it("Frontex: uses the latest reported month and a 12-month window, ignoring blank later months", () => {
    const rows = [["Route", "Border", "Nationality", "JUL2026", "AUG2026", "SEP2026"],
      ["Central Mediterranean Route", "Sea", "Eritrea", "10", "20", ""],
      ["Central Mediterranean Route", "Sea", "Unknown", "5", "5", ""],
      ["Other", "Land", "Syria", "99", "99", ""]];
    const d = parseFrontex(rows, "u")!;
    expect(d.months.at(-1)).toBe("AUG2026");
    expect(d.routes).toHaveLength(1);
    expect(d.routes[0]).toMatchObject({ latest: 25, last12: 40, top: [{ nationality: "Eritrea", value: 30 }] });
  });
  it("CBP: reads '2026 (FYTD)' years and only the southwest border", () => {
    const csv = "Fiscal Year,Month (abbv),Land Border Region,Citizenship,Encounter Count\n2025,SEP,Southwest Land Border,MEXICO,9\n2026 (FYTD),AUG,Southwest Land Border,MEXICO,7\n2026 (FYTD),AUG,Northern Land Border,CANADA,50";
    expect(parseCbp(csv, "u")).toMatchObject({ period: "Aug 2026", total: 7 });
  });
  it("UNHCR: drops same-country and unknown-origin pairs", () => {
    const d = parseUnhcr([{ coo: "SYR", coa: "TUR", coo_name: "Syrian Arab Rep.", coa_name: "Türkiye", refugees: 10, asylum_seekers: "2" },
      { coo: "UKN", coa: "USA", coo_name: "Unknown ", coa_name: "United States of America", refugees: 99, asylum_seekers: 0 },
      { coo: "AFG", coa: "AFG", coo_name: "Afghanistan", coa_name: "Afghanistan", refugees: 5, asylum_seekers: 0 }], 2025)!;
    expect(d.pairs).toEqual([{ from: "Syrian Arab Rep.", to: "Türkiye", value: 12 }]);
    expect(mapName("Syrian Arab Rep.")).toBe("syria");
  });
  it("UNHCR arrows are labelled as not illegal crossings", () => {
    const f = buildFlows({ frontex: null, cbp: null, unhcr: { year: 2025, pairs: [{ from: "Sudan", to: "Chad", value: 1 }] }, errors: {}, fetchedAt: "" });
    expect(f[0]!.label).toContain("not illegal crossings");
  });
  it("one boat icon per boat, capped", () => {
    expect(boatIcons(13)).toHaveLength(13);
    expect(boatIcons(0)).toHaveLength(0);
    expect(boatIcons(500)).toHaveLength(60);
  });
});
