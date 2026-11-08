# Free growth plan: share pictures plus a two-week outreach routine

No paid ads. You'll send messages and posts yourself; I'll build the share pictures and write everything you need to send.

## Step 1: share pictures for every figure (I build this)
At the moment, a shared figure link shows no proper picture. After this change, every shared link shows a clean navy card in your colours with:
- the figure name and today's published value (or "Not published")
- the source, the reference period and the date
- the UKStats logo and ukstats.co.uk

The card appears automatically when anyone shares these pages on X, Bluesky, Mastodon, Reddit, WhatsApp or Facebook:
- every figure's history page and "explained" page (UK and other countries)
- Small boats, Foreign aid, Debt (home page), Spending and the Daily briefing

The card never shows a sponsor and never shows a number that isn't on the page.

## Step 2: a ready-to-post kit (I write it, you post it)
I'll save a two-week posting kit in Project Files:
- **Day 1:** a message to friends and family asking them to follow @ukstatsglobal, and a pinned intro post for X, Bluesky and Mastodon.
- **Days 2–3:** a Show HN post and the public-datasets listing request (both already drafted; I'll refresh the links).
- **Days 4–14:** one "figure of the day" post per day, with its share card, plus the release-day posts the overnight team drafts.
- **Reddit:** three sourced answers for r/unitedkingdom and r/ukpolitics on small boats, debt and foreign aid. Before you post, I'll check each community's rules.
- **Journalists:** the five pitches from the launch pack, updated with the new share cards.

Every link will be tagged so we can see which posts bring visitors.

## Step 3: check what worked (after two weeks)
Using your analytics, I'll compare visits from social, Reddit and referrals before and after the posts, and pick what to do more of.

## Technical details
- A new image route (e.g. `/api/public/og/$metricId.png`) renders a 1200×630 PNG from cached snapshot values (payload_cache/metric_snapshots) using a worker-safe SVG-to-PNG renderer, and caches it at the edge for one hour.
- The head() of each listed route adds og:image, twitter:image (absolute ukstats.co.uk or stats.solutions URL per host) and twitter:card summary_large_image.
- A unit test for the card text: a missing value shows "Not published", and the source and period always appear.
- Links are tagged with utm_source=<platform> and utm_medium=social.
- The posting kit is saved to the marketing folder in Project Files, and plan.md is updated.
