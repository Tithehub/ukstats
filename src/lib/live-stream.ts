/** Pull an 11-character YouTube video ID out of a live/watch/youtu.be/shorts/embed link, or a bare ID. */
export function parseStreamId(input: string): string | null {
  const s = (input ?? "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let u: URL;
  try { u = new URL(s.startsWith("http") ? s : `https://${s}`); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = u.searchParams.get("v");
    const m = u.pathname.match(/^\/(live|shorts|embed)\/([\w-]{11})/);
    if (!id && m) id = m[2] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export const SUGGESTION_MAX_AGE_MS = 24 * 3600_000;
/** ISO cut-off: suggestions created before this are cleared. */
export const suggestionCutoff = (now = Date.now()) => new Date(now - SUGGESTION_MAX_AGE_MS).toISOString();
/** Only unreviewed suggestions expire; approved explainers and used posts stay. */
export const isExpiredSuggestion = (row: { created_at: string; status: string }, now = Date.now()) =>
  ["pending", "open"].includes(row.status) && row.created_at < suggestionCutoff(now);
