/** Horse racing is hidden on the public site until launch. Flip RACING_PUBLIC to true to launch. */
export const RACING_PUBLIC = false;

const SUFFIX = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/;

/** Lovable preview hosts (not published slugs or custom domains). */
export function isPreviewHost(host: string | null | undefined): boolean {
  const h = (host ?? "").toLowerCase().split(":")[0] ?? "";
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (h.endsWith(".lovableproject.com") || h.endsWith(".lovableproject-dev.com")) return true;
  if (!SUFFIX.test(h)) return false;
  const labels = h.split(".");
  const first = labels[0] ?? "";
  if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(first)) return true;
  if (/^project--.+-dev$/.test(first)) return true;
  if (/^live--[0-9a-f-]{36}(?:-thr_[a-z0-9]+)?$/.test(first) && labels.length === 4) return true;
  return false;
}

export function racingVisible(host: string | null | undefined): boolean {
  return RACING_PUBLIC || isPreviewHost(host);
}
