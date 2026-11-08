/** Hosts our own pages live on; checkout/portal return links may only point here. */
const OWN_HOSTS = ["ukstats.co.uk", "www.ukstats.co.uk", "stats.solutions", "www.stats.solutions"];

export function isOwnReturnUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 500) return false;
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return u.protocol === "http:" || u.protocol === "https:";
  if (u.protocol !== "https:" || u.username || u.password) return false;
  return OWN_HOSTS.includes(h) || h.endsWith(".lovable.app") || h.endsWith(".lovableproject.com");
}

export function assertReturnUrl(raw: unknown): string {
  if (!isOwnReturnUrl(raw)) throw new Error("Invalid return URL");
  return raw;
}

/** Public HTTPS host only: no IP literals, local or internal names, ports or credentials. */
export function publicHttpsUrl(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return null;
  if (/(^|\.)(localhost|local|internal|lan|home|corp|intranet|localdomain)$/.test(h)) return null;
  return u;
}
