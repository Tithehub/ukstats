# UKStats — Continuous Improvement Roadmap

Prioritised suggestions for making UKStats the best public statistics site in the UK. Ordered by impact. Nothing here invents figures — every item keeps the official-source-only rule.

## Tier 1 — Trust & reliability (do first)

1. **Feed health monitor page** (`/status`)
   - Public page showing every official feed: last successful fetch, last failure, uptime %.
   - Turns the "no live feed" states from a weakness into a transparency feature nobody else has.
2. **Automated daily sweep hardening**
   - Confirm the daily briefing cron is actually firing (the scheduler was never verified), add alerting when a feed goes stale, and backfill missed days.
3. **Security pass**
   - Re-run the security scan, verify RLS on all new tables (daily_briefings, social_accounts, metric_snapshots), and confirm the `/outreach` page is admin-only end to end.

## Tier 2 — Depth & differentiation

4. **Compare tool** (`/compare`)
   - Pick any two metrics (e.g. house prices vs wages, crime vs police numbers) and chart them together over time. Hugely shareable.
5. **Regional dashboards** (`/regions/$code`)
   - One page per UK region/nation pulling together crime, house prices, population, NHS and cost-of-living for that area — the maps already have the data.
6. **Release calendar** (`/calendar`)
   - "Next expected release" dates already exist per metric; surface them as a forward calendar so journalists know when to come back.
7. **More history**
   - Extend ONS time series further back where published (debt to 1993, migration, inflation to 1989), and add decade views.

## Tier 3 — Growth & reach

8. **Email alerts** — subscribe to a metric, get an email when a new figure is published (uses the change log we already record).
9. **Better embeds** — per-metric embed cards with theme options, so blogs/news sites carry UKStats figures with attribution links back.
10. **SEO content pages** — each metric gets a plain-English explainer page ("What is the UK national debt?") that ranks in search and funnels to the live figure.
11. **Press kit polish** — downloadable logo/brand assets and ready-made citation snippets on `/press`.

## Tier 4 — Polish

12. **Performance** — audit bundle size, lazy-load heavy charts/maps, image optimisation.
13. **Accessibility audit** — keyboard navigation, screen-reader labels on charts, contrast checks.
14. **Mobile app-like experience** — installable PWA with offline cache of last-seen figures.

## Suggested first sprint

Items 1, 2, 3 (trust), then 4 and 6 (differentiation). These are the highest impact for credibility and return visits.

## Technical notes

- Feed monitor reads the existing metric_snapshots/metric_changes tables plus a new feed_checks log.
- Compare tool reuses the existing history loader and chart components.
- Email alerts need a verified sending domain (email service already available via Lovable Cloud).
- No new paid features; everything stays free, donations-only.
