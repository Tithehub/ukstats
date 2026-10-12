/**
 * Deciding whether a picture link a sponsor pasted is safe for us to open.
 *
 * Pure on purpose: the fetching lives in a server handler, so this stays
 * testable and can never be talked into opening an address inside our own
 * network (where a cloud machine keeps its keys and metadata).
 */

const PRIVATE_SUFFIXES = [".localhost", ".local", ".internal", ".home", ".lan"];

export const PRIVATE_HOST_MESSAGE = "That address points inside a private network, so we won't open it.";
export const NOT_A_LINK_MESSAGE = "That isn't a web address we can open.";
export const HTTPS_ONLY_MESSAGE = "Banner image links must start with https://";
export const NO_CREDENTIALS_MESSAGE = "Banner image links can't carry a password.";

/** True for anything that isn't a real public machine name. */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || PRIVATE_SUFFIXES.some((s) => h.endsWith(s))) return true;
  const v6 = h.match(/^\[(.+)\]$/);
  if (v6) return isPrivateIpv6(v6[1] ?? "");
  if (h.includes(":")) return isPrivateIpv6(h);
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isPrivateIpv4(h);
  return false;
}

export function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map((p) => Number(p));
  if (parts.length !== 4) return true;
  if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a = 0, b = 0, c = 0] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // this machine, private, loopback
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local — cloud metadata lives here
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT range
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // multicast and reserved
  return false;
}

export function isPrivateIpv6(raw: string): boolean {
  const v = raw.toLowerCase();
  if (!v || v === "::" || v === "::1" || v === "1") return true;
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
  if (/^fe[89ab]/.test(v)) return true; // link-local
  const mapped = v.match(/::ffff:(\d{1,3}(\.\d{1,3}){3})$/);
  if (mapped) return isPrivateIpv4(mapped[1] ?? "");
  return false;
}

/** The plain reason we won't open this link, or null when it's fine to try. */
export function linkHostProblem(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return NOT_A_LINK_MESSAGE;
  }
  if (u.protocol !== "https:") return HTTPS_ONLY_MESSAGE;
  if (u.username || u.password) return NO_CREDENTIALS_MESSAGE;
  if (isPrivateHost(u.hostname)) return PRIVATE_HOST_MESSAGE;
  return null;
}
