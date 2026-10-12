/**
 * Reading a picture's real size straight from its file bytes, plus the rule a
 * sponsor's banner must satisfy.
 *
 * Pure and dependency-free: no native image library, so it runs in the browser,
 * in a server function and inside the worker this app deploys to.
 */

export type ImageFormat = "png" | "jpeg" | "webp" | "gif";

export type ImageSize = { width: number; height: number; format: ImageFormat };

/** The banner we already show (the example estate-agent picture) is exactly this. */
export const BANNER_MIN_WIDTH = 1536;
export const BANNER_MIN_HEIGHT = 512;
/** 3 wide to 1 tall, with a little give so a re-saved picture isn't punished. */
export const BANNER_RATIO = 3;
export const BANNER_RATIO_TOLERANCE = 0.1;
export const BANNER_MAX_BYTES = 2 * 1024 * 1024;
export const BANNER_FORMATS = ["jpeg", "png", "webp"] as const;
export const BANNER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const BANNER_REQUIREMENTS =
  "A wide banner: 3 wide to 1 tall, at least 1536×512, jpg, png or webp, under 2MB.";

export const CANT_READ_MESSAGE = "We couldn't read that picture. Please send a jpg, png or webp file.";
export const TOO_BIG_MESSAGE = "That picture is too big — please send one under 2MB.";

function at(bytes: Uint8Array, i: number): number {
  if (i < 0 || i >= bytes.length) return 0;
  return bytes[i] ?? 0;
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  let s = "";
  for (let i = from; i < to; i++) s += String.fromCharCode(at(bytes, i));
  return s;
}

function u16be(bytes: Uint8Array, i: number): number {
  return (at(bytes, i) << 8) | at(bytes, i + 1);
}

function u16le(bytes: Uint8Array, i: number): number {
  return at(bytes, i) | (at(bytes, i + 1) << 8);
}

function u24le(bytes: Uint8Array, i: number): number {
  return at(bytes, i) | (at(bytes, i + 1) << 8) | (at(bytes, i + 2) << 16);
}

function u32le(bytes: Uint8Array, i: number): number {
  return (at(bytes, i) | (at(bytes, i + 1) << 8) | (at(bytes, i + 2) << 16) | (at(bytes, i + 3) << 24)) >>> 0;
}

function u32be(bytes: Uint8Array, i: number): number {
  return ((at(bytes, i) << 24) | (at(bytes, i + 1) << 16) | (at(bytes, i + 2) << 8) | at(bytes, i + 3)) >>> 0;
}

function png(bytes: Uint8Array): ImageSize | null {
  if (ascii(bytes, 0, 8) !== "\x89PNG\r\n\x1a\n") return null;
  if (ascii(bytes, 12, 16) !== "IHDR") return null;
  const width = u32be(bytes, 16);
  const height = u32be(bytes, 20);
  if (!width || !height) return null;
  return { width, height, format: "png" };
}

const JPEG_SOF = (marker: number) =>
  marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

function jpeg(bytes: Uint8Array): ImageSize | null {
  if (at(bytes, 0) !== 0xff || at(bytes, 1) !== 0xd8) return null;
  let i = 2;
  let guard = 0;
  while (i + 9 < bytes.length && guard++ < 400) {
    if (at(bytes, i) !== 0xff) {
      i++;
      continue;
    }
    const marker = at(bytes, i + 1);
    // Stand-alone markers carry no length.
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    if (JPEG_SOF(marker)) {
      const height = u16be(bytes, i + 5);
      const width = u16be(bytes, i + 7);
      if (!width || !height) return null;
      return { width, height, format: "jpeg" };
    }
    const segmentLength = u16be(bytes, i + 2);
    if (segmentLength < 2) return null;
    i += 2 + segmentLength;
  }
  return null;
}

function webp(bytes: Uint8Array): ImageSize | null {
  if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 12) !== "WEBP") return null;
  let p = 12;
  let guard = 0;
  while (p + 8 <= bytes.length && guard++ < 40) {
    const fourCc = ascii(bytes, p, p + 4);
    const size = u32le(bytes, p + 4);
    const data = p + 8;
    if (fourCc === "VP8X") {
      const width = u24le(bytes, data + 4) + 1;
      const height = u24le(bytes, data + 7) + 1;
      return width && height ? { width, height, format: "webp" } : null;
    }
    if (fourCc === "VP8L") {
      const packed = u32le(bytes, data + 1);
      const width = (packed & 0x3fff) + 1;
      const height = ((packed >> 14) & 0x3fff) + 1;
      return width && height ? { width, height, format: "webp" } : null;
    }
    if (fourCc === "VP8 ") {
      const limit = Math.min(size, 30);
      for (let k = data; k + 7 <= data + limit; k++) {
        if (at(bytes, k) === 0x9d && at(bytes, k + 1) === 0x01 && at(bytes, k + 2) === 0x2a) {
          const width = u16le(bytes, k + 3) & 0x3fff;
          const height = u16le(bytes, k + 5) & 0x3fff;
          return width && height ? { width, height, format: "webp" } : null;
        }
      }
    }
    p = data + size + (size % 2);
  }
  return null;
}

function gif(bytes: Uint8Array): ImageSize | null {
  const head = ascii(bytes, 0, 6);
  if (head !== "GIF87a" && head !== "GIF89a") return null;
  const width = u16le(bytes, 6);
  const height = u16le(bytes, 8);
  return width && height ? { width, height, format: "gif" } : null;
}

/** Real pixel size and format of a picture, or null when we can't read it. */
export function readImageSize(bytes: Uint8Array): ImageSize | null {
  return png(bytes) ?? jpeg(bytes) ?? webp(bytes) ?? gif(bytes);
}

/** The plain words a sponsor sees when their picture doesn't fit the banner. */
export function bannerProblem(size: ImageSize | null, byteLength: number): string | null {
  if (byteLength > BANNER_MAX_BYTES) {
    return TOO_BIG_MESSAGE;
  }
  if (!size) {
    return CANT_READ_MESSAGE;
  }
  if (!BANNER_FORMATS.includes(size.format as (typeof BANNER_FORMATS)[number])) {
    return `Only jpg, png or webp pictures work — that one is a ${size.format}.`;
  }
  const ratio = size.width / size.height;
  const rightShape = Math.abs(ratio - BANNER_RATIO) <= BANNER_RATIO_TOLERANCE;
  const bigEnough = size.width >= BANNER_MIN_WIDTH && size.height >= BANNER_MIN_HEIGHT;
  if (rightShape && !bigEnough) {
    return `That picture is ${size.width}×${size.height} — the right shape but too small. We need at least ${BANNER_MIN_WIDTH}×${BANNER_MIN_HEIGHT}.`;
  }
  if (!rightShape || !bigEnough) {
    return `That picture is ${size.width}×${size.height}. We need a wide banner — 3 wide to 1 tall, at least ${BANNER_MIN_WIDTH}×${BANNER_MIN_HEIGHT}.`;
  }
  return null;
}

/** Quick browser-side check of a chosen file, before anything is uploaded. */
export function bannerFileProblem(file: { name: string; size: number; type: string }): string | null {
  if (file.size > BANNER_MAX_BYTES) {
    return "That picture is too big — please send one under 2MB.";
  }
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!(BANNER_EXTENSIONS as readonly string[]).includes(ext)) {
    return "Only jpg, png or webp pictures work.";
  }
  return null;
}
