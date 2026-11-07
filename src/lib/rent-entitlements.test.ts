import { describe, expect, it } from "vitest";
import { clampChannel, isChannelLive, NO_ENTITLEMENT, RENT_COUNTRY_CODES, type ChannelSettings } from "./rent-entitlements";

const req: ChannelSettings = { slug: "my-chan", display_name: "My", logo_url: null, accent: "#ff0000", presented_by: null, layout: "classic", countries: ["gb", "fr", "de"], all_countries: true, presenter: "ai", show_sponsor_box: false };
const base = { ...NO_ENTITLEMENT, active: true };

describe("rent entitlements", () => {
  it("limits countries to the paid number", () => {
    expect(clampChannel(req, { ...base, max_countries: 2 }).countries).toEqual(["gb", "fr"]);
  });
  it("all countries only when granted", () => {
    expect(clampChannel(req, base).all_countries).toBe(false);
    expect(clampChannel(req, { ...base, all_countries: true }).countries).toEqual(RENT_COUNTRY_CODES);
  });
  it("AI presenter only when granted", () => {
    expect(clampChannel(req, base).presenter).toBe("self");
    expect(clampChannel(req, { ...base, ai_presenter: true }).presenter).toBe("ai");
  });
  it("sponsor box stays on unless removal is granted", () => {
    expect(clampChannel(req, base).show_sponsor_box).toBe(true);
    expect(clampChannel(req, { ...base, no_sponsor_box: true }).show_sponsor_box).toBe(false);
  });
  it("expired or inactive channels are not live", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    expect(isChannelLive({ ...base, expires_at: "2026-11-01T00:00:00Z" }, now)).toBe(false);
    expect(isChannelLive({ ...base, expires_at: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(isChannelLive(NO_ENTITLEMENT, now)).toBe(false);
  });
});
