# Games sections on the admin page + one-click posting to X, Mastodon and Bluesky

## What you'll see on the admin Agents page (above Marketing drafts)
**Games**
- Each game with plays and players for today, the last 7 days and all time.
- Aim High, Vote Lowe shows its runs split by Easy, Normal and Hard.

**Games leaderboard**
- Top 10 nicknames this week for each quiz game, plus an overall top 10.
- Top 10 for Aim High, Vote Lowe at each difficulty, still labelled "unchecked" as on the public board.
- Nicknames only, never emails.

## Marketing drafts: one click to X, Mastodon and Bluesky
- The nightly drafts are now written as one post per figure instead of a separate copy for each site. The text fits X's 280-character limit, because X is the shortest of the three.
- You still approve each post. Then one **Post to X, Mastodon & Bluesky** button sends it to all three of your connected accounts (@ukstatsglobal, @ukstats@mastodon.social, @ukstats.bsky.social).
- The result shows for each site, for example "X: posted · Bluesky: failed (reason)". The post is marked posted when at least one site succeeds, and you can retry any site that failed.
- Older drafts made for one site only keep working as they do now.
- Nothing ever posts without your click.

## Note on X
Your X account is already connected using your own X app keys. Before the first post, check that the X app is set to "Read and write", or X will refuse it. The built-in X connection can only read from X, not post, so it isn't used.

## Technical details
- `getGamesAdminStats` (POST, requireSupabaseAuth, has_role admin check, then supabaseAdmin loaded inside the handler) aggregates game_scores and arcade_scores. Profile display names are joined in, using London days. A pure aggregation helper gets a test for the weekly top-10 ordering and ties.
- New GamesAdminPanel and GamesLeaderboardPanel are placed before MarketingPanel in agents.tsx.
- marketing.ts: add an "all" target with a 280-character limit (link counted as 23 characters, as X shortens links). The engine dedupes on kind|metric|"all". Add a test that "all" drafts are 280 characters or fewer.
- MarketingPanel: for "all" drafts, target every connected x/mastodon/bluesky account and show results per platform. Reuse the existing postToSocialAccounts.
- Update the social-accounts memory: posting stays approval-gated, and one click posts to X, Mastodon and Bluesky.
