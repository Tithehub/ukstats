import { describe, expect, it } from "vitest";
import { classify, mergeReports, parsePoliceScotland, parseRss, toReports } from "./news-reports";

const PLACES: [string, string, number, number, 0 | 1][] = [["United Kingdom", "Glasgow", 55.88, -4.25, 0], ["France", "Paris", 48.87, 2.33, 1]];
const now = new Date("2026-11-03T22:00:00Z");

describe("news reports", () => {
  it("reads RSS headlines verbatim", () => {
    const x = `<item><title><![CDATA[Protest in Glasgow city centre]]></title><description><![CDATA[Hundreds gathered.]]></description><link>https://bbc.co.uk/a</link><pubDate>Tue, 03 Nov 2026 20:00:00 GMT</pubDate></item>`;
    expect(parseRss(x)[0]).toEqual({ title: "Protest in Glasgow city centre", summary: "Hundreds gathered.", link: "https://bbc.co.uk/a", published: "2026-11-03T20:00:00.000Z" });
  });
  it("reads Police Scotland notices", () => {
    const h = `<h3><a href="/what-s-happening/news/2026/november/x/" class="a">Road re-opened</a></h3>\n<p class="my-1">Text.</p>\n<small class="text-muted">03/11/2026 21:08:35</small>`;
    expect(parsePoliceScotland(h)[0]?.published).toBe("2026-11-03T21:08:00Z");
  });
  it("classifies protests, riots and plane incidents", () => {
    expect(classify("Protesters march on George Square")).toBe("protest");
    expect(classify("Disorder in city centre")).toBe("riot");
    expect(classify("Plane diverted after bomb threat")).toBe("aviation");
    expect(classify("New flight route announced")).toBeNull();
  });
  it("places reports on a named city and drops anything older than 3 days", () => {
    const raw = [{ title: "Glasgow protest", summary: "", link: "a", published: "2026-11-03T10:00:00Z" }, { title: "Paris protest", summary: "", link: "b", published: "2026-10-20T10:00:00Z" }];
    const r = toReports(raw, "BBC News", false, PLACES, now);
    expect(r).toHaveLength(1);
    expect(r[0]?.place).toBe("Glasgow, United Kingdom");
  });
  it("shows a headline once per publisher", () => {
    const a = toReports([{ title: "Glasgow protest", summary: "", link: "a", published: "2026-11-03T10:00:00Z" }], "BBC News", false, PLACES, now);
    expect(mergeReports([a, a])).toHaveLength(1);
  });
});
