/**
 * Where a sponsor's own banner picture lives, and how to prove a path belongs
 * to the person claiming it. Shared by the browser (which uploads) and the
 * server (which checks before saving).
 */

export const BANNER_BUCKET = "sponsor-banners";
export const BANNER_URL_SECONDS = 86400; // one day

const PICTURE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

/** A fresh path inside the sponsor's own folder. */
export function bannerObjectPath(userId: string, fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const safe = (PICTURE_EXTENSIONS as readonly string[]).includes(ext) ? ext : "jpg";
  return `${userId}/${Date.now()}.${safe}`;
}

/** True only for one file, straight inside this sponsor's own folder. */
export function isOwnBannerPath(path: string, userId: string): boolean {
  if (!path || path.length > 500) return false;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) return false;
  const parts = path.split("/");
  if (parts.length !== 2) return false;
  const [folder = "", name = ""] = parts;
  if (folder !== userId) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) return false;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return (PICTURE_EXTENSIONS as readonly string[]).includes(ext);
}
