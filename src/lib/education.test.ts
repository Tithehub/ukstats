import { describe, expect, it } from "vitest";
import { cleanNumber, mapGias, mapOfsted, parseCsv, pickFilterOptions, searchPattern, summariseOfsted, ukDate, type EesMeta } from "./education";

describe("suppressed cells are not published, never zero", () => {
  it("returns null for DfE and Ofsted suppression codes", () => {
    for (const c of ["c", "z", "x", "SUPP", "NE", "NULL", "", ":"]) expect(cleanNumber(c)).toBeNull();
  });
  it("keeps a real zero", () => expect(cleanNumber("0")).toBe(0));
  it("reads commas and percent signs", () => expect(cleanNumber("1,234.5%")).toBe(1234.5));
});

describe("CSV parser", () => {
  it("handles quoted commas, escaped quotes and newlines", () => {
    expect(parseCsv('a,"b,c","d ""e""\nf"\r\n1,2,3')).toEqual([["a", "b,c", 'd "e"\nf'], ["1", "2", "3"]]);
  });
});

describe("GIAS register", () => {
  const base = { URN: "100000", EstablishmentName: "Test School", "EstablishmentStatus (name)": "Open", Postcode: "EC3A 5DE", Town: "London", NumberOfPupils: "", PercentageFSM: "SUPP" };
  it("skips closed schools", () => expect(mapGias({ ...base, "EstablishmentStatus (name)": "Closed" }, "2026-11-08")).toBeNull());
  it("keeps blank pupil numbers as not published", () => {
    const s = mapGias(base, "2026-11-08")!;
    expect(s.pupils).toBeNull();
    expect(s.fsm_pct).toBeNull();
    expect(s.search).toContain("ec3a5de");
  });
});

describe("Ofsted outcomes", () => {
  it("keeps report-card grades verbatim", () => {
    const m = mapOfsted({ URN: "1", Achievement: "Needs attention", "Safeguarding standards": "Met", "Inspection start date": "05/03/2026" }, "2026-09-30")!;
    expect(m.rec.framework).toBe("report card");
    expect(m.rec.grades).toContainEqual({ area: "Achievement", grade: "Needs attention" });
    expect(m.rec.inspected).toBe("2026-03-05");
  });
  it("uses Ofsted's 1–4 key for older graded inspections", () => {
    const m = mapOfsted({ URN: "2", "Latest OEIF overall effectiveness": "3", "Inspection start date of latest OEIF graded inspection": "01/02/2022" }, "2026-09-30")!;
    expect(m.rec.headline).toBe("Requires improvement");
  });
  it("prefers a later ungraded visit and quotes its outcome", () => {
    const m = mapOfsted({ URN: "3", "Latest OEIF overall effectiveness": "2", "Inspection start date of latest OEIF graded inspection": "01/02/2018", "Ungraded inspection overall outcome": "School remains Good", "Date of latest ungraded inspection": "01/02/2023" }, "2026-09-30")!;
    expect(m.rec.framework).toBe("ungraded");
    expect(m.rec.headline).toBe("School remains Good");
  });
  it("never merges report-card and graded counts", () => {
    const a = mapOfsted({ URN: "1", Achievement: "Exceptional" }, "x")!.rec;
    const b = mapOfsted({ URN: "2", "Latest OEIF overall effectiveness": "1", "Inspection start date of latest OEIF graded inspection": "01/01/2020" }, "x")!.rec;
    const s = summariseOfsted([a, b]);
    expect(s.reportCard["Achievement"]).toEqual({ Exceptional: 1 });
    expect(s.graded).toEqual({ Outstanding: 1 });
  });
});

describe("EES filter picking", () => {
  const meta = { filters: [{ id: "f", label: "Absence type", options: [{ id: "a", label: "Persistent absence" }, { id: "t", label: "Total pupils" }] }, { id: "g", label: "School type", options: [{ id: "x", label: "Special" }, { id: "y", label: "Total" }] }], indicators: [], locations: [], timePeriods: [] } as EesMeta;
  it("uses overrides and otherwise the Total option", () => expect(pickFilterOptions(meta, { "Absence type": "Persistent absence" })).toEqual(["a", "y"]));
  it("falls back to a Total-labelled option", () => expect(pickFilterOptions({ ...meta, filters: [meta.filters[0]!] })).toEqual(["t"]));
});

describe("search", () => {
  it("escapes wildcards", () => expect(searchPattern("50%_off")).toBe("%50 off%"));
  it("needs two characters", () => expect(searchPattern("a")).toBeNull());
  it("reads UK dates", () => expect(ukDate("9/1/2026")).toBe("2026-01-09"));
});
