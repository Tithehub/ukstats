# Make UKStats better: trust first, then visitors

You chose **trust & reliability** as the focus and **more visitors** as the goal. This plan does both: the trust work is what makes people (and journalists) share and link to the site, which is what brings visitors.

## What the numbers say (18 Sep – 17 Oct 2026)

- 182 visits total, but growing: 39 visits on 16 Oct, up from 1–3 a day in September.
- Most visits are "Direct" (no referrer recorded) — 113 of 182. Google sent 33, Bluesky 5, Mastodon 3.
- Most visited pages: home (67), register (25), maps (12), foreign-aid (9).
- Search visitors leave quickly (89% bounce, ~1 page per visit) — they land on a figure page and don't find a reason to stay.

## Part 1 — Trust & reliability (build)

1. **Feed health page** (`/status`)
   - A public page listing every official feed: last successful pull, last failure, and whether it's fresh, ageing or overdue.
   - Turns "no live feed" moments into a transparency feature no competitor has — this is the single biggest credibility win.
2. **Verify the daily sweep is firing**
   - Confirm the scheduled job that refreshes figures actually runs, and add a record of each run so the status page has real data to show.
3. **Security re-check**
   - A fresh security scan (the last one ran before the sponsor dashboard was added).

## Part 2 — More visitors (build + outreach)

4. **Publish everything that's waiting** — the slogan, Restore Britain dedication and navy theme, safest-places rankings (UK/US/Canada), funding pause and legal statement, speed improvements. Much of this is already verified in preview; none of it is live yet.
5. **Dataset markup on figure pages** — add the structured data Google needs so UKStats figures can appear in Google Dataset Search, then submit the sitemap in Search Console. Search is already your second-biggest source of visits.
6. **Share tools that earn links** — the existing "embed a figure" widget gets a clearer call-to-action on figure pages, so bloggers and journalists carry UKStats figures (with a link back) in their articles.
7. **Outreach you can do (I draft, you send):**
   - A "Show HN" post on Hacker News for the free API — no signup, no donations in the pitch.
   - A listing in the awesome-public-datasets directory (free, well-trafficked by researchers).
   - Daily one-figure posts on Bluesky/Mastodon from the daily statement, timed to release days.

## What stays untouched

- No invented figures, ever. The status page reports what feeds actually did.
- Sponsors never appear beside figures, in embeds or share images.
- Funding pause and legal hold stay exactly as they are.

## Checks and delivery

- Typecheck, the full test suite, and a fresh security scan pass.
- Browser checks of /status, a figure page's new markup, and the embed call-to-action on phone and desktop.
- Publishing happens only when you say "publish".
