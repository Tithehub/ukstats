import { describe, expect, it } from "vitest";
import { isExpiredSuggestion, parseStreamId } from "./live-stream";

describe("parseStreamId", () => {
  it("reads live links with tracking", () => expect(parseStreamId("https://www.youtube.com/live/5To5U1Ccx-8?si=E_yHpiyK-XSZNt7z")).toBe("5To5U1Ccx-8"));
  it("reads watch, youtu.be, shorts and bare IDs", () => {
    expect(parseStreamId("https://youtube.com/watch?v=cB8_dNZp5kA")).toBe("cB8_dNZp5kA");
    expect(parseStreamId("youtu.be/cB8_dNZp5kA")).toBe("cB8_dNZp5kA");
    expect(parseStreamId("https://m.youtube.com/shorts/cB8_dNZp5kA")).toBe("cB8_dNZp5kA");
    expect(parseStreamId("cB8_dNZp5kA")).toBe("cB8_dNZp5kA");
  });
  it("rejects other sites and junk", () => {
    expect(parseStreamId("https://vimeo.com/live/5To5U1Ccx-8")).toBeNull();
    expect(parseStreamId("hello")).toBeNull();
    expect(parseStreamId("https://youtube.com/@ukstatsglobal")).toBeNull();
  });
});

describe("24-hour suggestion clear-out", () => {
  const now = Date.parse("2026-11-11T18:00:00Z");
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  it("keeps a 23-hour-old suggestion", () => expect(isExpiredSuggestion({ created_at: ago(23), status: "pending" }, now)).toBe(false));
  it("drops a 25-hour-old suggestion", () => expect(isExpiredSuggestion({ created_at: ago(25), status: "pending" }, now)).toBe(true));
  it("never drops approved explainers", () => expect(isExpiredSuggestion({ created_at: ago(72), status: "approved" }, now)).toBe(false));
});
