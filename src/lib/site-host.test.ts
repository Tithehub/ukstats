import { describe, expect, it } from "vitest";
import { brandFromHost, canonicalFor } from "./site-host";

describe("site host", () => {
  it("stats.solutions is the global brand", () => {
    expect(brandFromHost("stats.solutions")).toBe("global");
    expect(brandFromHost("www.stats.solutions")).toBe("global");
  });
  it("ukstats.co.uk and unknown hosts are UK", () => {
    expect(brandFromHost("ukstats.co.uk")).toBe("uk");
    expect(brandFromHost("localhost:8080")).toBe("uk");
  });
  it("world pages are credited to stats.solutions", () => {
    expect(canonicalFor("/fr")).toBe("https://stats.solutions/fr");
    expect(canonicalFor("/gold")).toBe("https://stats.solutions/gold");
  });
  it("UK pages stay on ukstats.co.uk", () => {
    expect(canonicalFor("/register")).toBe("https://ukstats.co.uk/register");
    expect(canonicalFor("/")).toBe("https://ukstats.co.uk/");
  });
});
