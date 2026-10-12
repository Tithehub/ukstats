import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BANNER_MAX_BYTES,
  bannerFileProblem,
  bannerProblem,
  readImageSize,
  type ImageSize,
} from "./banner-image";

/** Real files (tiny on purpose) so the byte readers are tested against actual formats. */
const FIXTURES = {
  png: "iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEklEQVR4nGPkEpFjAEmBiQAAAXaAED5u51GAAAAAElFTkSuQmCC",
  jpg: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAADAAYDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5cooor8qP79P/2Q==",
  webpLossy: "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoIAAQAAUAmJaQAA3AA/v0IwAA=",
  webpLossless: "UklGRiAAAABXRUJQVlA4TBQAAAAvC0ABAAdQgVQIIAAKmv7HiIj+Bw==",
  webpAlpha: "UklGRkgAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSAoAAAABB1DkiAhERP8DVlA4IBgAAAAwAQCdASoQAAgAAUAmJaQAA3AA/v0gUAA=",
  gif: "R0lGODdhBQAHAIAAAAAAAAAAACwAAAAABQAHAAAIDAABCBxIsKDBgwcDAgA7",
};

function bytesOf(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

describe("reading a picture's real size from its bytes", () => {
  it("reads a png", () => {
    expect(readImageSize(bytesOf(FIXTURES.png))).toEqual({ width: 4, height: 2, format: "png" });
  });
  it("reads a jpg", () => {
    expect(readImageSize(bytesOf(FIXTURES.jpg))).toEqual({ width: 6, height: 3, format: "jpeg" });
  });
  it("reads all three webp flavours", () => {
    expect(readImageSize(bytesOf(FIXTURES.webpLossy))).toEqual({ width: 8, height: 4, format: "webp" });
    expect(readImageSize(bytesOf(FIXTURES.webpLossless))).toEqual({ width: 12, height: 6, format: "webp" });
    expect(readImageSize(bytesOf(FIXTURES.webpAlpha))).toEqual({ width: 16, height: 8, format: "webp" });
  });
  it("reads a gif", () => {
    expect(readImageSize(bytesOf(FIXTURES.gif))).toEqual({ width: 5, height: 7, format: "gif" });
  });
  it("says so when the bytes aren't a picture we know", () => {
    expect(readImageSize(new Uint8Array([...Buffer.from("<html><body>hi</body></html>")]))).toBeNull();
    expect(readImageSize(new Uint8Array([]))).toBeNull();
  });
});

describe("the banner rule a sponsor's picture must pass", () => {
  const size = (width: number, height: number, format: ImageSize["format"] = "jpeg"): ImageSize => ({ width, height, format });

  it("accepts the banner the site already shows", () => {
    const file = readFileSync(new URL("../assets/sponsor-example-estate-agent.jpg", import.meta.url));
    const real = readImageSize(new Uint8Array(file));
    expect(real).toEqual({ width: 1536, height: 512, format: "jpeg" });
    expect(bannerProblem(real, file.length)).toBeNull();
  });

  it("accepts the minimum size and anything wider-shaped but bigger", () => {
    expect(bannerProblem(size(1536, 512), 100_000)).toBeNull();
    expect(bannerProblem(size(3000, 1000), 100_000)).toBeNull();
  });

  it("rejects a square or tall picture, naming its size", () => {
    expect(bannerProblem(size(1200, 800), 100_000)).toBe(
      "That picture is 1200×800. We need a wide banner — 3 wide to 1 tall, at least 1536×512.",
    );
    expect(bannerProblem(size(1600, 1600), 100_000)).toBe(
      "That picture is 1600×1600. We need a wide banner — 3 wide to 1 tall, at least 1536×512.",
    );
  });

  it("rejects a picture that is the right shape but too small", () => {
    expect(bannerProblem(size(1200, 400), 100_000)).toBe(
      "That picture is 1200×400 — the right shape but too small. We need at least 1536×512.",
    );
  });

  it("rejects a gif, an unreadable file and an over-large one", () => {
    expect(bannerProblem(size(1536, 512, "gif"), 100_000)).toBe("Only jpg, png or webp pictures work — that one is a gif.");
    expect(bannerProblem(null, 100_000)).toBe("We couldn't read that picture. Please send a jpg, png or webp file.");
    expect(bannerProblem(size(1536, 512), BANNER_MAX_BYTES + 1)).toBe("That picture is too big — please send one under 2MB.");
  });

  it("checks the file a sponsor picked before anything is uploaded", () => {
    expect(bannerFileProblem({ name: "banner.jpg", size: 300_000, type: "image/jpeg" })).toBeNull();
    expect(bannerFileProblem({ name: "banner.png", size: 300_000, type: "image/png" })).toBeNull();
    expect(bannerFileProblem({ name: "banner.gif", size: 300_000, type: "image/gif" })).toBe("Only jpg, png or webp pictures work.");
    expect(bannerFileProblem({ name: "banner.jpg", size: BANNER_MAX_BYTES + 1, type: "image/jpeg" })).toBe(
      "That picture is too big — please send one under 2MB.",
    );
  });
});
