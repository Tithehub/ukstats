import { describe, expect, it } from "vitest";
import { directoryEntries, filterDirectory } from "@/lib/directory";

const base = { tagline: null, approved: true, active: true, paid: true, environment: "live", starts_at: null, ends_at: null, region: "all", regions: ["all"] };
const now = new Date("2026-11-08T00:00:00Z");

describe("business directory", () => {
  it("lists only approved, active, paid, in-date live sponsors", () => {
    const rows = [
      { ...base, id: "1", name: "Listed", url: "https://www.listed.com/" },
      { ...base, id: "2", name: "Unapproved", url: "https://a.com", approved: false },
      { ...base, id: "3", name: "Unpaid", url: "https://b.com", paid: false },
      { ...base, id: "4", name: "Off", url: "https://c.com", active: false },
      { ...base, id: "5", name: "Test", url: "https://d.com", environment: "sandbox" },
      { ...base, id: "6", name: "Ended", url: "https://e.com", ends_at: "2026-11-01T00:00:00Z" },
    ];
    const out = directoryEntries(rows, "live", now);
    expect(out.map((e) => e.name)).toEqual(["Listed"]);
    expect(out[0]!.domain).toBe("listed.com");
  });

  it("worldwide listings match every region filter", () => {
    const list = directoryEntries([{ ...base, id: "1", name: "World", url: "https://w.com" }, { ...base, id: "2", name: "France", url: "https://f.com", regions: ["fr"] }], "live", now);
    expect(filterDirectory(list, "", "de").map((e) => e.name)).toEqual(["World"]);
    expect(filterDirectory(list, "", "fr").map((e) => e.name)).toEqual(["France", "World"]);
  });
});
