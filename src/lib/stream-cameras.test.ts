import { describe, expect, it } from "vitest";
import { cameraForCard, type StreamCamera } from "./stream-cameras";
import { STREAM_CAMERAS } from "./stream-cameras.data";

describe("cameraForCard", () => {
  it("returns null for a country with no allowed camera, so the clip box is used", () => {
    expect(cameraForCard("Inflation", "france", STREAM_CAMERAS)).toBeNull();
  });
  it("never picks a camera from an operator that is not allowed", () => {
    const bad: StreamCamera = { ...STREAM_CAMERAS[0]!, id: "x", operator: "Random insecure cam site", keywords: ["inflation"] };
    expect(cameraForCard("Inflation", "france", [{ ...bad, country: "france" }])).toBeNull();
  });
  const live = STREAM_CAMERAS.map((c) => ({ ...c, live: true }));
  it("never shows a camera that is not truly live (TfL JamCams are periodic loops)", () => {
    expect(cameraForCard("Small boat arrivals", "united kingdom", STREAM_CAMERAS)).toBeNull();
  });
  it("matches the UK figure to a live camera by keyword", () => {
    expect(cameraForCard("Small boat arrivals", "united kingdom", live)?.place).toBe("Parliament Square, London");
  });
  it("skips a failed camera", () => {
    expect(cameraForCard("Small boat arrivals", "united kingdom", live, ["tfl-00001.06501"])?.id).not.toBe("tfl-00001.06501");
  });
});
