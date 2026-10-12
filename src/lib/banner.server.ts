/**
 * Server-only banner checks: read a picture back out of our own folder, or open
 * a link a sponsor pasted — and apply the size rule to the bytes we actually
 * got, never to what the browser claimed.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BANNER_MAX_BYTES,
  CANT_READ_MESSAGE,
  TOO_BIG_MESSAGE,
  bannerProblem,
  readImageSize,
  type ImageSize,
} from "@/lib/banner-image";
import { BANNER_BUCKET } from "@/lib/banner-paths";
import { linkHostProblem } from "@/lib/banner-link";

export type BannerCheck = { ok: true; size: ImageSize } | { ok: false; message: string };

export const CANT_OPEN_MESSAGE = "We couldn't open that link. Please check it, or upload the picture instead.";

const LINK_TIMEOUT_MS = 5000;
const MAX_HOPS = 4;

/** The size rule, applied to real file bytes. */
export function checkBannerBytes(bytes: Uint8Array): BannerCheck {
  const size = readImageSize(bytes);
  if (!size) return { ok: false, message: CANT_READ_MESSAGE };
  const problem = bannerProblem(size, bytes.length);
  return problem ? { ok: false, message: problem } : { ok: true, size };
}

/** Read a response, giving up as soon as it goes past the banner's size limit. */
async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > max) return null;
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array(await res.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Open a pasted picture link. Every hop is re-checked before it is followed, so
 * a friendly-looking address can't bounce us into a private network, and the
 * download is cut off at the banner's size limit.
 */
export async function checkBannerLink(url: string): Promise<BannerCheck> {
  let next = url;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const problem = linkHostProblem(next);
    if (problem) return { ok: false, message: problem };
    let res: Response;
    try {
      res = await fetch(next, { redirect: "manual", signal: AbortSignal.timeout(LINK_TIMEOUT_MS) });
    } catch {
      return { ok: false, message: CANT_OPEN_MESSAGE };
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return { ok: false, message: CANT_OPEN_MESSAGE };
      try {
        next = new URL(location, next).toString();
      } catch {
        return { ok: false, message: CANT_OPEN_MESSAGE };
      }
      continue;
    }
    if (!res.ok) return { ok: false, message: `That link didn't give us a picture (it said ${res.status}).` };
    const bytes = await readCapped(res, BANNER_MAX_BYTES);
    if (!bytes) return { ok: false, message: TOO_BIG_MESSAGE };
    return checkBannerBytes(bytes);
  }
  return { ok: false, message: CANT_OPEN_MESSAGE };
}

/** Read a file the sponsor already uploaded to their own folder, and check it. */
export async function checkBannerUpload(admin: SupabaseClient, path: string): Promise<BannerCheck> {
  const { data, error } = await admin.storage.from(BANNER_BUCKET).download(path);
  if (error || !data) return { ok: false, message: CANT_READ_MESSAGE };
  const bytes = new Uint8Array(await data.arrayBuffer());
  return checkBannerBytes(bytes);
}
