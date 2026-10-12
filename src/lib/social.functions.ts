import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { platformSpec, type SocialPlatform } from "@/lib/social";

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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verify the credentials with the platform and return the account label to show. */
async function verify(platform: SocialPlatform, c: Creds): Promise<string> {
  switch (platform) {
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
      const base = (c["instance"] ?? "").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/v1/accounts/verify_credentials`, {
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
      const res = await fetch(c["webhookUrl"] ?? "");
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

async function send(platform: SocialPlatform, c: Creds, text: string, link: string): Promise<string | null> {
  switch (platform) {
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
      const base = (c["instance"] ?? "").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/v1/statuses`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${c["accessToken"]}` },
        body: JSON.stringify({ status: text.includes(link) ? text : `${text}\n${link}` }),
      });
      if (!res.ok) throw new Error(`Mastodon refused the post (${res.status}): ${await res.text()}`);
      const j = (await res.json()) as { url?: string };
      return j.url ?? null;
    }
    case "telegram": {
      const res = await fetch(`https://api.telegram.org/bot${c["botToken"]}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: c["chatId"],
          text: text.includes(link) ? text : `${text}\n${link}`,
          disable_web_page_preview: false,
        }),
      });
      if (!res.ok) throw new Error(`Telegram refused the post (${res.status}): ${await res.text()}`);
      return null;
    }
    case "discord":
    case "slack": {
      const body = text.includes(link) ? text : `${text}\n${link}`;
      const res = await fetch(c["webhookUrl"] ?? "", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(platform === "discord" ? { content: body } : { text: body }),
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

    const results: { id: string; label: string; ok: boolean; url: string | null; error: string | null }[] = [];
    for (const row of rows ?? []) {
      const platform = row.platform as SocialPlatform;
      try {
        const url = await send(platform, clean(row.credentials), text, link);
        await db.from("social_accounts").update({ last_posted_at: new Date().toISOString() }).eq("id", row.id);
        results.push({ id: row.id as string, label: row.label as string, ok: true, url, error: null });
      } catch (e) {
        results.push({
          id: row.id as string,
          label: row.label as string,
          ok: false,
          url: null,
          error: e instanceof Error ? e.message : "Posting failed.",
        });
      }
    }
    return { results };
  });
