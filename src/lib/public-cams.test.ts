import { describe, expect, it } from "vitest";
import { camKind, camKindLabel, camImageSrc, camsForCountry, stepCam, parseCaltransCams, parseTflCams } from "./public-cams";

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
