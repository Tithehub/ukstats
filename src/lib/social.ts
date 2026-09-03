/**
 * Social connections people can attach to their own accounts.
 *
 * Only platforms that let an account holder issue their own credentials are
 * offered for direct posting — nothing here asks anyone for a password to a
 * platform, and no credential is ever sent back to the browser once saved.
 */
export type SocialPlatform = "bluesky" | "mastodon" | "telegram" | "discord" | "slack";

export interface SocialField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  help?: string;
}

export interface SocialPlatformSpec {
  key: SocialPlatform;
  name: string;
  blurb: string;
  /** Where the person creates the credential on the platform itself. */
  docsUrl: string;
  docsLabel: string;
  fields: SocialField[];
  limit: number | null;
}

export const SOCIAL_PLATFORMS: SocialPlatformSpec[] = [
  {
    key: "bluesky",
    name: "Bluesky",
    blurb: "Posts to your Bluesky account using an app password you create yourself.",
    docsUrl: "https://bsky.app/settings/app-passwords",
    docsLabel: "Create an app password",
    limit: 300,
    fields: [
      { key: "handle", label: "Handle", placeholder: "you.bsky.social" },
      {
        key: "appPassword",
        label: "App password",
        placeholder: "xxxx-xxxx-xxxx-xxxx",
        secret: true,
        help: "An app password, never your account password. Revoke it any time from Bluesky settings.",
      },
    ],
  },
  {
    key: "mastodon",
    name: "Mastodon",
    blurb: "Posts to any Mastodon server with an access token from your own account.",
    docsUrl: "https://docs.joinmastodon.org/client/token/",
    docsLabel: "How to get an access token",
    limit: 500,
    fields: [
      { key: "instance", label: "Server", placeholder: "https://mastodon.social" },
      { key: "accessToken", label: "Access token", placeholder: "Your application access token", secret: true },
    ],
  },
  {
    key: "telegram",
    name: "Telegram",
    blurb: "Posts to a channel or group through a bot you own.",
    docsUrl: "https://core.telegram.org/bots#how-do-i-create-a-bot",
    docsLabel: "Create a bot with @BotFather",
    limit: 4096,
    fields: [
      { key: "botToken", label: "Bot token", placeholder: "123456:ABC-DEF…", secret: true },
      { key: "chatId", label: "Chat or channel ID", placeholder: "@yourchannel" },
    ],
  },
  {
    key: "discord",
    name: "Discord",
    blurb: "Posts to a Discord channel through a webhook you create in channel settings.",
    docsUrl: "https://support.discord.com/hc/en-us/articles/228383668",
    docsLabel: "Create a channel webhook",
    limit: 2000,
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/…", secret: true },
    ],
  },
  {
    key: "slack",
    name: "Slack",
    blurb: "Posts to a Slack channel through an incoming webhook from your workspace.",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    docsLabel: "Create an incoming webhook",
    limit: 3000,
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/…", secret: true },
    ],
  },
];

/** Platforms that require a reviewed developer app, so posting stays manual. */
export const MANUAL_ONLY = [
  { name: "X", why: "X requires a paid developer app per account, so use the composer link." },
  { name: "LinkedIn", why: "LinkedIn only issues posting access to reviewed partner apps." },
  { name: "Facebook / Threads", why: "Meta requires an app review before an account can post through the API." },
  { name: "Reddit", why: "Reddit posting needs a per-subreddit registered script app." },
];

export const platformSpec = (key: string) => SOCIAL_PLATFORMS.find((p) => p.key === key) ?? null;
