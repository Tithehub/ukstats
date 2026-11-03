/** Pure rules for the live visitor chat (messages are never stored). */
export const MAX_MESSAGE = 280;
export const MAX_NAME = 24;
export const MIN_GAP_MS = 3000; // one message every 3 seconds per visitor
export const KEEP_MESSAGES = 200;

const BLOCKED = ["fuck", "cunt", "nigger", "faggot", "paki", "retard", "kill yourself", "kys"];
const LINK = /(https?:\/\/|www\.)\S+/gi;

export type CheckResult = { ok: true; text: string } | { ok: false; reason: string };

export function cleanName(raw: string): string {
  return raw.replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, MAX_NAME);
}

export function checkMessage(raw: string, lastSentAt: number | null, now: number): CheckResult {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "Type a message first." };
  if (text.length > MAX_MESSAGE) return { ok: false, reason: `Keep messages under ${MAX_MESSAGE} characters.` };
  if (lastSentAt !== null && now - lastSentAt < MIN_GAP_MS) return { ok: false, reason: "Slow down — one message every 3 seconds." };
  const lower = text.toLowerCase();
  if (BLOCKED.some((w) => lower.includes(w))) return { ok: false, reason: "That message breaks the chat rules." };
  return { ok: true, text: text.replace(LINK, "[link removed]") };
}
