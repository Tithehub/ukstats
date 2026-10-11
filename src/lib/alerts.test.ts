import { describe, expect, it } from "vitest";
import { mainEvent, parseCapFeed, worstColour } from "./alerts";

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
  <entry>
    <cap:areaDesc>Bienne - Neuch&acirc;tel</cap:areaDesc>
    <cap:event>Ground frost</cap:event>
    <cap:severity>Moderate</cap:severity>
    <cap:expires>2026-10-12T06:00:00+00:00</cap:expires>
    <title>Yellow Low-temperature Warning issued for Switzerland - Bienne</title>
  </entry>
  <entry>
    <cap:areaDesc>Zurich</cap:areaDesc>
    <cap:event>Wind</cap:event>
    <cap:severity>Severe</cap:severity>
    <cap:expires>2026-10-12T18:00:00+00:00</cap:expires>
    <title>Orange Wind Warning issued for Switzerland - Zurich</title>
  </entry>
  <entry>
    <cap:areaDesc>Geneva</cap:areaDesc>
    <cap:event>Wind</cap:event>
    <cap:severity>Severe</cap:severity>
    <cap:expires>2026-10-12T20:00:00+00:00</cap:expires>
    <title>Orange Wind Warning issued for Switzerland - Geneva</title>
  </entry>
</feed>`;

describe("parseCapFeed", () => {
  it("reads every warning with its colour, event, area and expiry", () => {
    const alerts = parseCapFeed(FEED);
    expect(alerts).toHaveLength(3);
    expect(alerts[0]).toMatchObject({ colour: "yellow", event: "Ground frost", severity: "Moderate", expires: "2026-10-12T06:00:00+00:00" });
    expect(alerts[0]?.area).toBe("Bienne - Neuchâtel");
    expect(alerts[1]?.colour).toBe("orange");
  });

  it("keeps the highest colour present", () => {
    expect(worstColour(parseCapFeed(FEED))).toBe("orange");
    expect(worstColour([{ colour: "yellow", event: "a", area: "", severity: "", expires: null, title: "" }, { colour: "red", event: "b", area: "", severity: "", expires: null, title: "" }])).toBe("red");
  });

  it("names the most common event and how many areas it covers", () => {
    expect(mainEvent(parseCapFeed(FEED))).toEqual({ event: "Wind", areas: 2 });
  });

  it("returns nothing for a feed with no warnings, so the card can say none are in force", () => {
    expect(parseCapFeed('<feed xmlns="http://www.w3.org/2005/Atom"></feed>')).toEqual([]);
    expect(worstColour([])).toBeNull();
    expect(mainEvent([])).toBeNull();
  });

  it("ignores entries with no CAP event instead of inventing a warning", () => {
    expect(parseCapFeed("<feed><entry><title>note</title></entry></feed>")).toEqual([]);
  });
});
