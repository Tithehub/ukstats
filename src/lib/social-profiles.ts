/**
 * UKStats' own social accounts. The X account posts manually through the
 * composer links in the outreach queue — X API posting needs a paid developer
 * app, so nothing ever posts automatically (see MANUAL_ONLY in social.ts).
 */
export interface SocialProfile {
  key: "x" | "bluesky" | "mastodon";
  label: string;
  handle: string;
  url: string;
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  { key: "x", label: "X", handle: "@ukstatsglobal", url: "https://x.com/ukstatsglobal" },
  { key: "bluesky", label: "Bluesky", handle: "@ukstats.bsky.social", url: "https://bsky.app/profile/ukstats.bsky.social" },
  { key: "mastodon", label: "Mastodon", handle: "@ukstats@mastodon.social", url: "https://mastodon.social/@ukstats" },
];
