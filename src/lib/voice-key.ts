/** Constant-time comparison of a supplied stream voice key against the stored secret. */
export function voiceKeyMatches(supplied: unknown, secret: string | undefined): boolean {
  if (typeof supplied !== "string" || !secret || secret.length < 16) return false;
  if (supplied.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= supplied.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

const STORE = "ukstats-voicekey";

/** Browser only: picks up ?voicekey= once, keeps it for the tab, and removes it from the visible address. */
export function readVoiceKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const k = url.searchParams.get("voicekey");
    if (k) {
      sessionStorage.setItem(STORE, k);
      url.searchParams.delete("voicekey");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      return k;
    }
    return sessionStorage.getItem(STORE);
  } catch { return null; }
}
