# Connect Bluesky to the agent team

There is no ready-made Bluesky connector in Lovable, but Bluesky's API is free and works with an "app password" from your Bluesky account. We can wire it directly into the existing Marketing agent flow so approved posts can be published to your Bluesky account from the /agents page.

## What you need to do (one-time)

1. Create a Bluesky account for UKStats (e.g. @ukstats.co.uk or @ukstats.bsky.social) if you haven't already.
2. In Bluesky: Settings → App Passwords → Add App Password. Copy the generated password.
3. Give me the handle and app password — I'll store them as encrypted secrets (never in code, never visible in the browser).

## What I'll build

1. **Secrets**: store `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` as server-only secrets.
2. **Server-side Bluesky client** (`src/lib/social/bluesky.server.ts`):
   - Sign in with the app password (`com.atproto.server.createSession`).
   - Create a post (`com.atproto.repo.createRecord`) with the approved draft text, including the tagged link as a proper clickable link facet.
   - 20s timeouts, clear error messages surfaced to the page.
3. **Posting function** in `agents.functions.ts` (admin-only): takes an approved marketing post, publishes it to Bluesky, records the posted URL and timestamp on the post row. Rejects unapproved drafts and duplicate posting.
4. **/agents Marketing panel**: the "Post to my accounts" button on an approved Bluesky draft becomes a real "Post to Bluesky" action with a confirmation, then shows the live post link. If secrets aren't set yet, the button explains that Bluesky isn't connected.
5. **Safety rules kept**: posts only ever contain figures copied verbatim from published site data (source + link), nothing is ever posted automatically — every post needs your explicit approval and click. No spam, no mass posting.
6. **Test**: a small unit test for the post-text/link-facet builder, plus a manual test post once you've shared the credentials.

## Technical details

- Bluesky API: `https://bsky.social/xrpc/com.atproto.server.createSession` and `.../com.atproto.repo.createRecord`; no npm package needed, plain `fetch` from a server function keeps it auditable.
- Link facets computed from UTF-8 byte offsets so links are clickable and counted correctly against Bluesky's 300-character limit.
- Mastodon can follow the same pattern later (it needs an access token from your Mastodon account's developer settings).
