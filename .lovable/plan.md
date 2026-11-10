# Socials: Rupert Lowe on X

A new Socials page showing Rupert Lowe's latest public X posts, word for word. Preview only — nothing published until you say so.

## What you will see
- New page **/socials** with Rupert Lowe's latest posts: exact text, date/time (London), and a "View on X" link on each.
- Clear label: "Social media, not official statistics". Kept out of stats, PDF reports, streams and embeds.
- Linked from the menu, page search and the Restore Britain page in the same change.
- Posts refresh every 15 minutes. If X stops answering, the last good set stays with its "last checked" time.

## Step 1 — Connect X
- Open the X connect card. You sign in with the @ukstatsglobal developer account and paste its read-only Bearer token (from the X Developer Portal, Keys and tokens). Read-only only: nothing will ever post.

## Step 2 — Build
- Server function (POST) looks up @RupertLowe's account, then fetches recent posts (text, created time, id). No likes/view counts.
- Cache in stored payload `x-rupert-lowe-v1` (15-minute refresh, serve last good during refresh or outage).
- Page `src/routes/socials.tsx` with its own title/description/share tags; uses PageFeedback for loading/errors.
- Add link to nav, search and Restore Britain page; add an AGENTS.md rule.
- Small test for the "serve last good when X fails" rule.

## Limits to know
- X free API tier allows very few reads per month; the 15-minute cache keeps usage low but if the quota runs out the page shows the last good set and says so.
