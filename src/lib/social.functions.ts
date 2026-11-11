import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { platformSpec, type SocialPlatform } from "@/lib/social";
import { publicHttpsUrl } from "@/lib/safe-url";
import { oauthHeader, type XCreds } from "@/lib/x-oauth";
import { youtubeIdFromLink, youtubeThumbnailUrls } from "@/lib/stream-launch";

interface Thumb { url: string; bytes: Uint8Array<ArrayBuffer>; type: string; title: string }

/** Fetch the stream's thumbnail from YouTube's fixed image host (never arbitrary URLs). */
async function loadThumb(link: string): Promise<Thumb | null> {
  const id = youtubeIdFromLink(link);
  if (!id) return null;
  let title = "UKStats live";
  try {
    const o = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
    if (o.ok) title = String(((await o.json()) as { title?: string }).title ?? title).slice(0, 300);
  } catch { /* keep default title */ }
  for (const url of youtubeThumbnailUrls(id)) {
    try {
      const r = await fetch(url, { redirect: "error" });
      if (!r.ok) { await r.body?.cancel(); continue; }
      const bytes = new Uint8Array(await r.arrayBuffer());
      if (bytes.length < 2000 || bytes.length > 950_000) continue; // placeholder or too big for Bluesky
      return { url, bytes, type: r.headers.get("content-type") ?? "image/jpeg", title };
    } catch { /* try next */ }
  }
  return null;
}

function mastodonBase(c: Creds): string {
  const u = publicHttpsUrl((c["instance"] ?? "").startsWith("http") ? c["instance"]! : `https://${c["instance"] ?? ""}`);
  if (!u) throw new Error("Enter a public Mastodon server address, e.g. https://mastodon.social");
  return u.origin;
}

function xCreds(c: Creds): XCreds {
  const v = { apiKey: c["apiKey"] ?? "", apiSecret: c["apiSecret"] ?? "", accessToken: c["accessToken"] ?? "", accessSecret: c["accessSecret"] ?? "" };
  if (!v.apiKey || !v.apiSecret || !v.accessToken || !v.accessSecret) throw new Error("Enter all four X keys.");
  return v;
}

function discordWebhook(c: Creds): string {
  const url = c["webhookUrl"] ?? "";
  if (!/^https:\/\/(?:canary\.|ptb\.)?(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/.test(url)) throw new Error("That is not a Discord webhook URL.");
  return url;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  label: string;
  createdAt: string;
  lastPostedAt: string | null;
}

type Creds = Record<string, string>;

function clean(input: unknown): Creds {
  const out: Creds = {};
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
  }
  return out;
}

const REDDIT_UA = "web:ukstats.co.uk:v1.0 (by /u/ukstats)";
async function redditToken(c: Creds): Promise<string> {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${c["clientId"] ?? ""}:${c["clientSecret"] ?? ""}`)}`, "content-type": "application/x-www-form-urlencoded", "user-agent": REDDIT_UA },
    body: new URLSearchParams({ grant_type: "password", username: c["username"] ?? "", password: c["password"] ?? "" }),
  });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !j.access_token) throw new Error(`Reddit rejected those details (${res.status}${j.error ? `: ${j.error}` : ""}). Check the app ID, secret, username and password.`);
  return j.access_token;
}
function redditTarget(c: Creds): string {
  const sr = (c["subreddit"] ?? "").replace(/^\/?r\//i, "").trim();
  return sr || `u_${(c["username"] ?? "").replace(/^\/?u\//i, "")}`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verify the credentials with the platform and return the account label to show. */
async function verify(platform: SocialPlatform, c: Creds): Promise<string> {
  switch (platform) {
    case "x": {
      const url = "https://api.x.com/2/users/me";
      const res = await fetch(url, { headers: { authorization: await oauthHeader("GET", url, xCreds(c)) } });
      if (!res.ok) throw new Error(`X rejected those keys (${res.status}): ${await res.text()}`);
      const j = (await res.json()) as { data?: { username?: string } };
      return `@${j.data?.username ?? "account"}`;
    }
    case "reddit": {
      const tok = await redditToken(c);
      const res = await fetch("https://oauth.reddit.com/api/v1/me", { headers: { authorization: `Bearer ${tok}`, "user-agent": REDDIT_UA } });
      if (!res.ok) throw new Error(`Reddit sign-in worked but the account could not be read (${res.status}).`);
      const j = (await res.json()) as { name?: string };
      return `u/${j.name ?? c["username"]} → ${redditTarget(c).startsWith("u_") ? "own profile" : `r/${redditTarget(c)}`}`;
    }
    case "bluesky": {
      const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: c["handle"], password: c["appPassword"] }),
      });
      if (!res.ok) throw new Error(`Bluesky rejected those details (${res.status}). Check the handle and app password.`);
      const j = (await res.json()) as { handle?: string };
      return `@${j.handle ?? c["handle"]}`;
    }
    case "mastodon": {
      const base = mastodonBase(c);
      const res = await fetch(`${base}/api/v1/accounts/verify_credentials`, { redirect: "error",
        headers: { authorization: `Bearer ${c["accessToken"]}` },
      });
      if (!res.ok) throw new Error(`Mastodon rejected the access token (${res.status}).`);
      const j = (await res.json()) as { acct?: string };
      return `@${j.acct ?? "account"}@${base.replace(/^https?:\/\//, "")}`;
    }
    case "telegram": {
      const res = await fetch(`https://api.telegram.org/bot${c["botToken"]}/getMe`);
      if (!res.ok) throw new Error(`Telegram rejected the bot token (${res.status}).`);
      const j = (await res.json()) as { result?: { username?: string } };
      return `@${j.result?.username ?? "bot"} → ${c["chatId"]}`;
    }
    case "discord": {
      const res = await fetch(discordWebhook(c), { redirect: "error" });
      if (!res.ok) throw new Error(`Discord did not recognise that webhook (${res.status}).`);
      const j = (await res.json()) as { name?: string; channel_id?: string };
      return j.name ? `${j.name}` : `channel ${j.channel_id ?? ""}`;
    }
    case "slack": {
      const url = c["webhookUrl"] ?? "";
      if (!/^https:\/\/hooks\.slack\.com\//.test(url)) throw new Error("That is not a Slack incoming webhook URL.");
      return "Slack channel webhook";
    }
  }
}

async function send(platform: SocialPlatform, c: Creds, text: string, link: string, thumb: Thumb | null = null): Promise<string | null> {
  switch (platform) {
    case "x": {
      const xc = xCreds(c);
      const mediaIds: string[] = [];
      let note = "";
      if (thumb) {
        try {
          const mu = "https://api.x.com/2/media/upload";
          const fd = new FormData();
          fd.append("media", new Blob([thumb.bytes], { type: thumb.type }), "livestream.jpg");
          fd.append("media_category", "tweet_image");
          const m = await fetch(mu, { method: "POST", headers: { authorization: await oauthHeader("POST", mu, xc) }, body: fd });
          if (!m.ok) throw new Error(`${m.status}: ${await m.text()}`);
          const mj = (await m.json()) as { data?: { id?: string }; media_id_string?: string };
          const id = mj.data?.id ?? mj.media_id_string;
          if (id) mediaIds.push(String(id));
        } catch (e) {
          console.error("X media upload failed", e);
          note = " (posted without the picture: X refused it)";
        }
      }
      const tu = "https://api.x.com/2/tweets";
      const res = await fetch(tu, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: await oauthHeader("POST", tu, xc) },
        body: JSON.stringify({ text: text.includes(link) ? text : `${text}\n${link}`, ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}) }),
      });
      if (!res.ok) throw new Error(`X refused the post (${res.status}): ${await res.text()}`);
      const j = (await res.json()) as { data?: { id?: string } };
      if (note) console.warn(note);
      return j.data?.id ? `https://x.com/i/status/${j.data.id}${note ? "#no-picture" : ""}` : null;
    }
    case "reddit": {
      const tok = await redditToken(c);
      const title = (thumb?.title || text.replace(link, "")).replace(/\s+/g, " ").trim().slice(0, 300) || "UKStats live";
      const res = await fetch("https://oauth.reddit.com/api/submit", {
        method: "POST",
        headers: { authorization: `Bearer ${tok}`, "content-type": "application/x-www-form-urlencoded", "user-agent": REDDIT_UA },
        body: new URLSearchParams({ api_type: "json", kind: "link", sr: redditTarget(c), title, url: link, resubmit: "true" }),
      });
      const body = await res.text();
      if (!res.ok) throw new Error(`Reddit refused the post (${res.status}): ${body}`);
      const j = JSON.parse(body) as { json?: { errors?: unknown[][]; data?: { url?: string } } };
      if (j.json?.errors?.length) throw new Error(`Reddit refused the post: ${JSON.stringify(j.json.errors)}`);
      return j.json?.data?.url ?? null;
    }
    case "bluesky": {
      const session = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: c["handle"], password: c["appPassword"] }),
      });
      if (!session.ok) throw new Error(`Bluesky sign-in failed (${session.status}).`);
      const s = (await session.json()) as { accessJwt: string; did: string };
      const body = text.includes(link) ? text : `${text}\n${link}`;
      // Link facet so the URL is clickable in the timeline.
      const bytes = new TextEncoder().encode(body);
      const linkBytes = new TextEncoder().encode(link);
      const start = indexOfBytes(bytes, linkBytes);
      let embed: unknown = undefined;
      if (thumb) {
        const up = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
          method: "POST",
          headers: { "content-type": thumb.type, authorization: `Bearer ${s.accessJwt}` },
          body: thumb.bytes,
        });
        if (!up.ok) throw new Error(`Bluesky refused the picture (${up.status}).`);
        const blob = ((await up.json()) as { blob: unknown }).blob;
        embed = { $type: "app.bsky.embed.external", external: { uri: link, title: thumb.title, description: "Watch live on YouTube", thumb: blob } };
      }
      const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${s.accessJwt}` },
        body: JSON.stringify({
          repo: s.did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text: body,
            createdAt: new Date().toISOString(),
            ...(embed ? { embed } : {}),
            ...(start >= 0
              ? {
                  facets: [
                    {
                      index: { byteStart: start, byteEnd: start + linkBytes.length },
                      features: [{ $type: "app.bsky.richtext.facet#link", uri: link }],
                    },
                  ],
                }
              : {}),
          },
        }),
      });
      if (!res.ok) throw new Error(`Bluesky refused the post (${res.status}): ${await res.text()}`);
      const j = (await res.json()) as { uri?: string };
      const rkey = j.uri?.split("/").pop();
      return rkey ? `https://bsky.app/profile/${c["handle"]}/post/${rkey}` : null;
    }
    case "mastodon": {
      const base = mastodonBase(c);
      const mediaIds: string[] = [];
      if (thumb) {
        const fd = new FormData();
        fd.append("file", new Blob([thumb.bytes], { type: thumb.type }), "livestream.jpg");
        fd.append("description", "Livestream thumbnail");
        const m = await fetch(`${base}/api/v2/media`, { method: "POST", redirect: "error", headers: { authorization: `Bearer ${c["accessToken"]}` }, body: fd });
        if (!m.ok) throw new Error(`Mastodon refused the picture (${m.status}).`);
        mediaIds.push(String(((await m.json()) as { id: string }).id));
      }
      const res = await fetch(`${base}/api/v1/statuses`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${c["accessToken"]}` },
        body: JSON.stringify({ status: text.includes(link) ? text : `${text}\n${link}`, ...(mediaIds.length ? { media_ids: mediaIds } : {}) }),
      });
      if (!res.ok) throw new Error(`Mastodon refused the post (${res.status}): ${await res.text()}`);
      const j = (await res.json()) as { url?: string };
      return j.url ?? null;
    }
    case "telegram": {
      const msg = text.includes(link) ? text : `${text}\n${link}`;
      const usePhoto = thumb && msg.length <= 1024;
      const res = await fetch(`https://api.telegram.org/bot${c["botToken"]}/${usePhoto ? "sendPhoto" : "sendMessage"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(usePhoto
          ? { chat_id: c["chatId"], photo: thumb.url, caption: msg }
          : { chat_id: c["chatId"], text: msg, disable_web_page_preview: false }),
      });
      if (!res.ok) throw new Error(`Telegram refused the post (${res.status}): ${await res.text()}`);
      return null;
    }
    case "discord":
    case "slack": {
      const body = text.includes(link) ? text : `${text}\n${link}`;
      const hook = platform === "discord" ? discordWebhook(c) : (c["webhookUrl"] ?? "");
      if (platform === "slack" && !/^https:\/\/hooks\.slack\.com\/services\//.test(hook)) throw new Error("That is not a Slack incoming webhook URL.");
      const res = await fetch(hook, { redirect: "error",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(platform === "discord"
          ? { content: body, ...(thumb ? { embeds: [{ title: thumb.title, url: link, image: { url: thumb.url } }] } : {}) }
          : { text: body, ...(thumb ? { blocks: [
              { type: "section", text: { type: "mrkdwn", text: body } },
              { type: "image", image_url: thumb.url, alt_text: "Livestream thumbnail", title: { type: "plain_text", text: thumb.title.slice(0, 150) } },
            ] } : {}) }),
      });
      if (!res.ok) throw new Error(`The webhook refused the post (${res.status}): ${await res.text()}`);
      return null;
    }
  }
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export const listSocialAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialAccount[]> => {
    const db = await admin();
    const { data } = await db
      .from("social_accounts")
      .select("id, platform, label, created_at, last_posted_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id as string,
      platform: r.platform as SocialPlatform,
      label: r.label as string,
      createdAt: r.created_at as string,
      lastPostedAt: (r.last_posted_at as string | null) ?? null,
    }));
  });

export const connectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; credentials: Record<string, string> }) => input)
  .handler(async ({ data, context }): Promise<SocialAccount> => {
    const spec = platformSpec(data.platform);
    if (!spec) throw new Error("Unknown platform.");
    const creds = clean(data.credentials);
    for (const f of spec.fields) if (!creds[f.key]) throw new Error(`${f.label} is required.`);

    const label = await verify(spec.key, creds);

    const db = await admin();
    const { data: row, error } = await db
      .from("social_accounts")
      .insert({ user_id: context.userId, platform: spec.key, label, credentials: creds })
      .select("id, platform, label, created_at, last_posted_at")
      .single();
    if (error || !row) throw new Error("Could not save the connection.");
    return {
      id: row.id as string,
      platform: row.platform as SocialPlatform,
      label: row.label as string,
      createdAt: row.created_at as string,
      lastPostedAt: null,
    };
  });

export const disconnectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await admin();
    await db.from("social_accounts").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });

export const postToSocialAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountIds: string[]; text: string; link: string }) => input)
  .handler(async ({ data, context }) => {
    const text = String(data.text ?? "").slice(0, 5000);
    const link = String(data.link ?? "");
    if (!text.trim()) throw new Error("Nothing to post.");
    if (!/^https:\/\//.test(link)) throw new Error("The source link must be a full https link.");

    const db = await admin();
    const { data: rows } = await db
      .from("social_accounts")
      .select("id, platform, label, credentials")
      .eq("user_id", context.userId)
      .in("id", data.accountIds.slice(0, 10));

    const thumb = await loadThumb(link);
    const picture = Boolean(thumb);
    const results: { id: string; label: string; ok: boolean; url: string | null; error: string | null; picture: boolean }[] = [];
    for (const row of rows ?? []) {
      const platform = row.platform as SocialPlatform;
      try {
        const url = await send(platform, clean(row.credentials), text, link, thumb);
        await db.from("social_accounts").update({ last_posted_at: new Date().toISOString() }).eq("id", row.id);
        results.push({ id: row.id as string, label: row.label as string, ok: true, url, error: null, picture });
      } catch (e) {
        results.push({
          id: row.id as string,
          label: row.label as string,
          ok: false,
          url: null,
          error: e instanceof Error ? e.message : "Posting failed.",
          picture: false,
        });
      }
    }
    return { results };
  });
