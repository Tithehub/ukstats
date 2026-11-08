// Pure helpers for the Citizen Journalists directory. Listings are independent creators,
// never official sources, and only approved rows are ever shown publicly.
export const PLATFORMS = ["youtube", "x", "rumble", "substack", "website"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABEL: Record<Platform, string> = { youtube: "YouTube", x: "X", rumble: "Rumble", substack: "Substack", website: "Website" };
const HOSTS: Record<Exclude<Platform, "website">, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com"],
  x: ["x.com", "twitter.com", "www.x.com", "www.twitter.com"],
  rumble: ["rumble.com", "www.rumble.com"],
  substack: ["substack.com"],
};

/** Returns a clean https URL for the platform, null for empty, or throws on invalid. */
export function cleanLink(p: Platform, raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  let u: URL;
  try { u = new URL(s); } catch { throw new Error(`${PLATFORM_LABEL[p]} link is not a valid web address`); }
  if (u.protocol !== "https:") throw new Error(`${PLATFORM_LABEL[p]} link must start with https://`);
  if (p !== "website") {
    const h = u.hostname.toLowerCase();
    const ok = HOSTS[p].some((x) => h === x || (p === "substack" && h.endsWith(".substack.com")));
    if (!ok) throw new Error(`${PLATFORM_LABEL[p]} link must be on ${HOSTS[p][0]}`);
  }
  return u.toString();
}

/** YouTube channel id (UC…) from a /channel/ URL, else null. */
export function channelIdFrom(url: string | null): string | null {
  return url ? /\/channel\/(UC[\w-]{22})/.exec(url)?.[1] ?? null : null;
}

export interface Journalist {
  id: string; name: string; bio: string; photo_url: string | null; youtube_channel_id: string | null;
  youtube_url: string | null; x_url: string | null; rumble_url: string | null; substack_url: string | null; website_url: string | null;
}
export function platformsOf(j: Journalist): Platform[] {
  return PLATFORMS.filter((p) => !!j[`${p}_url` as const]);
}
export function filterJournalists<T extends Journalist>(list: T[], q: string, platform?: string): T[] {
  const n = q.trim().toLowerCase();
  return list.filter((j) => (!platform || platformsOf(j).includes(platform as Platform)) && (!n || `${j.name} ${j.bio}`.toLowerCase().includes(n)));
}
