import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Third-party broadcaster video must never enter the YouTube restream.
describe("broadcast page", () => {
  it("contains no YouTube embeds", () => {
    const src = readFileSync("src/routes/globe_.broadcast.tsx", "utf8");
    expect(/youtube(-nocookie)?\.com\/embed|<iframe/i.test(src)).toBe(false);
  });
  it("GlobeExplorer does not render the video side panel in broadcast mode", () => {
    const src = readFileSync("src/components/globe/GlobeExplorer.tsx", "utf8");
    expect(src).toContain('{!broadcast && <aside aria-label="Country controls"');
  });
});
