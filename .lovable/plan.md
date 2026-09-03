# Outreach agent: turn new official figures into shareable posts

A note first: an agent that blasts a link "anywhere it can be posted" is spam. X, Reddit, LinkedIn and Facebook all ban it, and the fastest result is a domain-level block plus SEO damage — the opposite of visibility. So this builds the version that actually works: an agent that watches your live feeds, writes genuinely interesting posts about each new UK figure, and publishes them to accounts you own, with everything else queued for one-click manual posting.

## 1. Post engine (`/outreach`)

An agent that runs on a schedule and drafts posts from real data:

- **Release trigger** — when a metric's figure changes (CPI, Bank Rate, small-boat arrivals, national debt, house prices, tax vs welfare), it drafts a post about that figure: the number, the change, the reference period, and the official source link.
- **Daily digest** — one "UK by the numbers today" draft each morning pulling the top vital signs.
- Each draft is written per platform: X (280 chars), Bluesky, LinkedIn (longer, analytical), Threads, Facebook, Reddit (title + body, subreddit-appropriate, no naked link-drop), Mastodon.
- Every draft carries the ukstats.co.uk deep link to that metric's `/history/<id>` page **and** the publisher's own link, so nothing looks like link-bait.
- A queue view: pending / approved / posted / skipped, with edit-in-place before approval.

Drafting uses Lovable AI to phrase the copy, but the numbers, periods and links are injected from the live payload — the model never invents a figure.

## 2. Publishing

Phased, so it is useful immediately:

- **Phase A (now)** — copy button per platform, plus a "share now" button that opens the platform's own composer prefilled. Works with zero credentials.
- **Phase B** — connect your own accounts and let approved posts publish automatically at a set time: X API v2, Bluesky (AT Protocol, app password), LinkedIn, Mastodon, Reddit, Telegram channel. Each is optional and off until you supply the credentials. Rate-limited to a sane cadence (max a few posts per platform per day) so accounts stay in good standing.

Auto-posting only ever fires on drafts you approved, unless you switch a metric to auto-approve.

## 3. Discovery pack (the part that actually compounds)

- **Per-metric OG images** — a generated share card for every metric and every page, so a shared link unfurls with the live number, its period and its source. This is the single biggest lift for click-through.
- **JSON-LD `Dataset` markup** on each metric page so Google Dataset Search and aggregators index individual figures.
- **RSS + JSON feeds** at `/feed.xml` — "new UK figures published" — which is what news aggregators, bots and Google News actually consume.
- **Embed promotion page** — your widget is the strongest growth channel: every embed on someone else's site is a permanent backlink. A page showing the widget builder, copy-paste snippets and examples.
- **Submission checklist** page (internal) listing directories worth a manual submission: Google Search Console, Bing Webmaster, Google Dataset Search, ONS/open-data listings, r/ukpolitics-adjacent communities' rules, Product Hunt, Hacker News timing guidance. Manual by design — these all reject automation.

## Technical notes

- `src/lib/outreach.ts` — post templates per platform, character budgets, link builders reusing `src/lib/share.ts`.
- `src/lib/outreach.functions.ts` — `draftPosts()` (diffs the current stats payload against the last snapshot), `listQueue()`, `approvePost()`, `publishPost()`.
- Tables: `outreach_posts` (metric_id, platform, body, link, status, scheduled_for, posted_at, external_id) and `metric_snapshots` (metric_id, value, as_of) for change detection. Service-role writes only; RLS restricts reads to authenticated admin.
- Scheduling via `pg_cron` hitting `src/routes/api/public/outreach-tick.ts`, authenticated with the cron secret already in `src/integrations/supabase/cron-auth.ts`.
- OG images rendered by a server route `src/routes/api/og/$metricId.ts` returning SVG (no native image libs — the Worker runtime can't run sharp/canvas).
- Platform credentials go in secrets, never in code. Nothing publishes until a credential exists.
- `/outreach` sits behind auth so the queue isn't public.

## Rules unchanged

Every post states a real published figure with its period and links to the issuing body. No estimates, no rounding-for-effect, no scraped or purchased distribution.
