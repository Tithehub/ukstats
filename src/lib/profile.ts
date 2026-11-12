/** Shown wherever a player picks a public nickname. */
export const REAL_NAME_WARNING = "Your nickname is shown publicly on leaderboards. We strongly recommend not using your real name.";

/** True when the nickname looks like it repeats part of the email (often a real name). */
export function looksLikeRealName(nickname: string, email: string | null | undefined): boolean {
  const n = nickname.toLowerCase().replace(/[^a-z]/g, "");
  if (n.length < 3 || !email) return false;
  const parts = (email.split("@")[0] ?? "").toLowerCase().split(/[^a-z]+/).filter((p) => p.length >= 3);
  const whole = parts.join("");
  return parts.some((p) => n.includes(p)) || (whole.length >= 3 && whole.includes(n));
}

export const AVATAR_MAX_BYTES = 1_000_000;
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
