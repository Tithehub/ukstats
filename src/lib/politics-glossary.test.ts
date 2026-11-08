import { describe, expect, it } from "vitest";
import { GLOSSARY, SCALE, findTerm, searchGlossary } from "./politics-glossary";
import { cleanLink, channelIdFrom } from "./citizen-journalists";

describe("politics glossary", () => {
  it("every term has a definition and an https source", () => {
    for (const t of GLOSSARY) {
      expect(t.short.length, t.slug).toBeGreaterThan(10);
      expect(t.source.url.startsWith("https://"), t.slug).toBe(true);
    }
  });
  it("slugs are unique and every scale step links to a term", () => {
    expect(new Set(GLOSSARY.map((t) => t.slug)).size).toBe(GLOSSARY.length);
    for (const s of SCALE) expect(findTerm(s.slug), s.slug).toBeDefined();
  });
  it("finds Civ-Nat by its abbreviation", () => {
    expect(searchGlossary("civ-nat").map((t) => t.slug)).toContain("civic-nationalism");
  });
});

describe("citizen journalist links", () => {
  it("rejects a non-YouTube host in the YouTube field", () => {
    expect(() => cleanLink("youtube", "https://evil.com/channel/x")).toThrow();
  });
  it("rejects plain http", () => {
    expect(() => cleanLink("website", "http://example.com")).toThrow();
  });
  it("reads the channel id from a channel URL", () => {
    expect(channelIdFrom("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv")).toBe("UCabcdefghijklmnopqrstuv");
  });
});
