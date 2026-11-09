import { describe, expect, it } from "vitest";
import { parseOregonCams, camKind, camKindLabel, camImageSrc, camsForCountry, stepCam, parseCaltransCams, parseTflCams } from "./public-cams";

describe("public cameras", () => {
  it("keeps available TfL cameras with https pictures and coordinates", () => {
    const cams = parseTflCams([
      { id: "JamCams_1", commonName: "A406", lat: 51.6, lon: -0.01, additionalProperties: [{ key: "available", value: "true" }, { key: "imageUrl", value: "https://x/1.jpg" }, { key: "videoUrl", value: "https://x/1.mp4" }] },
      { id: "JamCams_2", commonName: "Off", lat: 51.6, lon: -0.01, additionalProperties: [{ key: "available", value: "false" }, { key: "imageUrl", value: "https://x/2.jpg" }] },
      { id: "JamCams_3", commonName: "Http", lat: 51.6, lon: -0.01, additionalProperties: [{ key: "imageUrl", value: "http://x/3.jpg" }] },
    ]);
    expect(cams.map((c) => c.id)).toEqual(["tfl-JamCams_1"]);
    expect(cams[0]?.loop).toBe("https://x/1.mp4");
  });
  it("drops Caltrans cameras out of service or without coordinates", () => {
    const row = (inService: string, lat: string) => ({ cctv: { index: lat, inService, location: { locationName: "I-5", latitude: lat, longitude: "-118" }, imageData: { static: { currentImageURL: "https://c/i.jpg", currentImageUpdateFrequency: "2" } } } });
    const cams = parseCaltransCams({ data: [row("true", "34"), row("false", "35"), row("true", "")] }, 7);
    expect(cams.length).toBe(1);
    expect(cams[0]?.everyMin).toBe(2);
  });
  it("cache-buster changes only once per update window", () => {
    const c = { id: "a", lat: 0, lng: 0, place: "", operator: "Caltrans" as const, image: "https://c/i.jpg", everyMin: 2 };
    expect(camImageSrc(c, 0)).toBe(camImageSrc(c, 119_000));
    expect(camImageSrc(c, 0)).not.toBe(camImageSrc(c, 120_000));
  });
  it("lists cameras by country and steps round in place order", () => {
    const mk = (id: string, place: string, operator: "Caltrans" | "Transport for London") => ({ id, lat: 1, lng: 1, place, operator, image: "https://x", everyMin: 5 });
    const cams = [mk("b", "B road", "Caltrans"), mk("a", "A road", "Caltrans"), mk("l", "London", "Transport for London")];
    expect(camsForCountry(cams, "united states").map((c) => c.id)).toEqual(["a", "b"]);
    expect(camsForCountry(cams, "france")).toEqual([]);
    expect(stepCam(cams[1]!, cams, 1)?.id).toBe("b");
    expect(stepCam(cams[0]!, cams, 1)?.id).toBe("a");
    expect(stepCam(cams[2]!, cams, 1)).toBeNull();
  });
  it("marks Caltrans cameras with an https HLS stream as live, and TfL loops never as live", () => {
    const row = (u?: string) => ({ cctv: { index: "1", inService: "true", location: { latitude: "34", longitude: "-118" }, imageData: { streamingVideoURL: u, static: { currentImageURL: "https://c/i.jpg", currentImageUpdateFrequency: "2" } } } });
    expect(camKind(parseCaltransCams({ data: [row("https://w/CCTV-1.stream/playlist.m3u8")] }, 7)[0]!)).toBe("live");
    expect(camKind(parseCaltransCams({ data: [row("http://w/x.m3u8")] }, 7)[0]!)).toBe("still");
    expect(camKind(parseCaltransCams({ data: [row("")] }, 7)[0]!)).toBe("still");
    const tfl = parseTflCams([{ id: "J", lat: 51.5, lon: 0.1, additionalProperties: [{ key: "imageUrl", value: "https://x/1.jpg" }, { key: "videoUrl", value: "https://x/1.mp4" }] }])[0]!;
    expect(camKind(tfl)).toBe("loop");
    expect(camKindLabel(tfl)).toContain("not live");
  });
  it("lists live cameras first", () => {
    const a = { id: "a", lat: 1, lng: 1, place: "A", operator: "Caltrans" as const, image: "https://i", everyMin: 2 };
    const b = { ...a, id: "b", place: "Z", live: "https://l.m3u8" };
    expect(camsForCountry([a, b], "united states").map((c) => c.id)).toEqual(["b", "a"]);
  });
});

import { lks94ToLatLng, parseHongKongCams, camImageSrc as camSrc2 } from "./public-cams";
describe("more countries", () => {
  it("converts Lithuanian grid to Vilnius", () => {
    const [lat, lng] = lks94ToLatLng(576154, 6056867);
    expect(lat).toBeCloseTo(54.64, 1); expect(lng).toBeCloseTo(25.18, 1);
  });
  it("reads Hong Kong XML and skips entries without https picture", () => {
    const xml = "<image-list><image><key>A1</key><description>Road [A1]</description><latitude>22.2</latitude><longitude>114.1</longitude><url>https://x/A1.JPG</url></image><image><key>B</key><latitude>22</latitude><longitude>114</longitude><url>http://x/B.JPG</url></image></image-list>";
    const r = parseHongKongCams(xml);
    expect(r).toHaveLength(1); expect(r[0]!.place).toBe("Road, Hong Kong");
  });
  it("keeps existing query strings on picture links", () => {
    expect(camSrc2({ id: "l", lat: 1, lng: 1, place: "", operator: "Lithuanian Road Administration", image: "https://e/last?id=7", everyMin: 10 }, 0)).toBe("https://e/last?id=7&t=0");
  });
  it("reads Oregon TripCheck stills and skips bad filenames", () => {
    const j = { features: [{ attributes: { filename: "Astoria_pid392.jpg", latitude: 46.18, longitude: -123.85, title: "US101 at Astoria " } }, { attributes: { filename: "../x.jpg", latitude: 45, longitude: -122 } }] };
    expect(parseOregonCams(j)).toEqual([{ id: "or-Astoria_pid392", lat: 46.18, lng: -123.85, place: "US101 at Astoria, Oregon", operator: "Oregon DOT", image: "https://tripcheck.com/RoadCams/cams/Astoria_pid392.jpg", everyMin: 5 }]);
  });
});
