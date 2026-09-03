# Site clean-up, icons, and an outreach agent

Two parts: first a pass over the whole site so every control works on every device and icons carry more of the meaning, then the outreach agent.

A note on the agent: one that blasts a link "anywhere it can be posted" is spam. X, Reddit, LinkedIn and Facebook all ban it, and the fastest result is a domain-level block plus SEO damage — the opposite of visibility. So this builds the version that actually works: an agent that watches your live feeds, writes genuinely interesting posts about each new UK figure, and publishes them to accounts you own, with everything else queued for one-click manual posting.

## 0. Site clean-up and icons

A full pass across `/`, `/register`, `/maps`, `/tax-vs-welfare`, `/foreign-aid`, `/polling`, `/governments`, `/history/*`, `/create`, `/my-pages`, `/p/*`, `/widget`, `/embed/*` and `/support`:

- **Every control audited on real devices** — 390px phone, tablet and desktop. Fix anything that is unreachable, clipped, overlapping, off-canvas, or too small to hit: map layer toggles, the tax/welfare and foreign-aid basis toggles, chart range buttons, category dropdowns, share rows, the party search, the widget builder, tier pickers and the donation buttons.
- **Minimum 44px touch targets** on every button, toggle and link-button, with visible focus rings and correct `aria-label`/`aria-pressed` so the site is keyboard- and screen-reader-usable.
- **Consistent button system** — one set of primary / secondary / ghost / toggle styles used everywhere, replacing the ad-hoc bordered spans currently repeated across pages. Loading and disabled states included so nothing looks dead while data loads.
- **Icons to replace copy** — lucide icons throughout: freshness dots become clock / check / alert icons with text labels, share targets get their platform glyphs, categories get a distinct icon each (crime, money, housing, immigration, health, defence, weather, politics), and repeated word-buttons (Copy link, Download CSV, Official source, Expand chart, Print) become icon + short label. Every icon keeps an accessible label — icons add clarity, they never replace meaning on their own.
- **Navigation simplified** — the header nav has outgrown a single row; it becomes a compact icon-led menu with a proper mobile drawer, grouped by theme.
- **Density reduced** — long paragraphs on data pages trimmed to a line, with the detail moved into collapsible "About this figure" panels so the numbers lead.
- Verified with browser passes at three widths, clicking every interactive element and checking for console errors and horizontal overflow.


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
