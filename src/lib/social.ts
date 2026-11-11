/**
 * Social connections people can attach to their own accounts.
 *
 * Only platforms that let an account holder issue their own credentials are
 * offered for direct posting — only Reddit (whose script apps accept nothing else) takes a
 * password, and no credential is ever sent back to the browser once saved.
 */
export type SocialPlatform = "x" | "reddit" | "bluesky" | "mastodon" | "telegram" | "discord" | "slack";

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
    key: "x",
    name: "X",
    blurb: "Posts to your X account using keys from your own X developer app (set to Read and write).",
    docsUrl: "https://developer.x.com/en/portal/dashboard",
    docsLabel: "Open the X developer portal",
    limit: 280,
    fields: [
      { key: "apiKey", label: "API key", placeholder: "Consumer key", secret: true },
      { key: "apiSecret", label: "API key secret", placeholder: "Consumer secret", secret: true },
      { key: "accessToken", label: "Access token", placeholder: "123456-…", secret: true, help: "Generate this after setting app permissions to Read and write, or it will be read-only." },
      { key: "accessSecret", label: "Access token secret", placeholder: "Access secret", secret: true },
    ],
  },
  {
    key: "reddit",
    name: "Reddit",
    blurb: "Posts the link to your own Reddit profile (or a subreddit you name) using a personal \"script\" app you create on Reddit.",
    docsUrl: "https://www.reddit.com/prefs/apps",
    docsLabel: "Create a script app on Reddit",
    limit: 300,
    fields: [
      { key: "clientId", label: "App ID", placeholder: "The code under \"personal use script\"", secret: true },
      { key: "clientSecret", label: "App secret", placeholder: "secret", secret: true },
      { key: "username", label: "Reddit username", placeholder: "ukstats" },
      { key: "password", label: "Reddit password", placeholder: "Account password", secret: true, help: "Reddit's script apps only accept the account password. It is stored server-side and never shown again. Turn off two-factor login for this account or posting will fail." },
      { key: "subreddit", label: "Post to (optional)", placeholder: "Leave blank for your own profile", help: "Only name a subreddit whose rules allow links — self-promotion gets new accounts banned." },
    ],
  },
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
  { name: "LinkedIn", why: "LinkedIn only issues posting access to reviewed partner apps." },
  { name: "Facebook / Threads", why: "Meta requires an app review before an account can post through the API." },
];

export const platformSpec = (key: string) => SOCIAL_PLATFORMS.find((p) => p.key === key) ?? null;
