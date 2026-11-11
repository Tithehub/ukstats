/** OAuth 1.0a (HMAC-SHA1) request signing for X, using Web Crypto so it runs on the edge. */

export const pct = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export interface XCreds { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string }

/** Signature base string per RFC 5849 (params = oauth params + query/form params, not JSON bodies). */
export function signatureBase(method: string, url: string, params: Record<string, string>): string {
  const norm = Object.entries(params)
    .map(([k, v]) => [pct(k), pct(v)] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${method.toUpperCase()}&${pct(url)}&${pct(norm)}`;
}

export async function hmacSha1(key: string, text: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(text)));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Build the Authorization header. `extra` holds query/form params that must be signed. */
export async function oauthHeader(
  method: string,
  url: string,
  c: XCreds,
  extra: Record<string, string> = {},
  nonce = crypto.randomUUID().replace(/-/g, ""),
  timestamp = String(Math.floor(Date.now() / 1000)),
): Promise<string> {
  const oauth: Record<string, string> = {
    oauth_consumer_key: c.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: c.accessToken,
    oauth_version: "1.0",
  };
  const base = signatureBase(method, url, { ...oauth, ...extra });
  oauth["oauth_signature"] = await hmacSha1(`${pct(c.apiSecret)}&${pct(c.accessSecret)}`, base);
  return "OAuth " + Object.entries(oauth).map(([k, v]) => `${pct(k)}="${pct(v)}"`).join(", ");
}
