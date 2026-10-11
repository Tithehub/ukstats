# Marketing Agent for the overnight team

## Is it possible?
Mostly yes. The agents can do the marketing preparation every night for free. Posting only goes to your own accounts and only after you approve it. They will not bulk-post to Reddit, forums or comment sections. That gets a domain banned and does more harm than good.

## What research found (checked 11 Oct 2026)
- Searching for ukstats.co.uk turned up no mentions of UKStats anywhere else yet, and at least seven free UK stats sites compete with it (UK Facts, BritClock, UK Data Hub and others). UKStats stands out by showing where each figure comes from, how old it is and when the next one is due.
- Journalists will spot a few errors, so these come first:
  - The temperature comes from Open-Meteo, which is not the Met Office, even though the site says "official sources only".
  - One crime figure (4,160) looks like one area but is labelled UK-wide, and it shows a release date in the future.
  - Unemployment is filed under Finance.
  - Some "next release" dates on the calendar have already passed.
  - The press kit says there are 14 sources, but the support page lists 8.
  - The address /api shows an error page.

## Plan, in order
1. **Fix the errors above** (labels, source, dates, counts, and make /api go to the docs).
2. **New "Marketing" agent** in the nightly team, which drafts:
   - one sourced "figure of the day" post for Bluesky and Mastodon, built from the daily statement
   - release-day posts for big releases, such as GDP on 15 Oct, labour market on 20 Oct and CPI on 21 Oct, from the release calendar
   - links tagged so the site's visitor stats show which platform each visit came from
   - all of these waiting in /agents for your Approve. Approved posts go to your connected accounts.
3. **Make the site findable in Google Dataset Search**: add dataset labels to every figure history page, and list all the Explained pages in the sitemap.
4. **A ready-to-use launch kit in /agents** that you send or post yourself, because these places don't allow automated posting:
   - an awesome-public-datasets listing (GitHub)
   - a "Show HN" post about the free API, without mentioning donations
   - short personal pitches to data journalists: Paul Bradshaw, SA Mathieson's newsletter and Full Fact
   - a list of Bluesky data-journalism accounts to follow
5. **Weekly check** by the Marketing agent of who links to or mentions the site, shown in the morning briefing.
6. Save the marketing plan to your Files.

## Safety rails
Every number in a post comes from the site's live data. The AI only writes the wording around it. There's a daily limit on posts per platform. Nothing is posted without your approval.

## Technical section
- New agent step `marketing` in src/lib/agents/engine.server.ts writes rows to the existing outreach_posts table (status pending, source 'agent'). It uses the existing aiJson helper with strict schema, and values are injected from the payload.
- UTM: utm_source=<platform>&utm_medium=social&utm_campaign=agent.
- Dataset JSON-LD in the head() of history.$metricId.tsx. The sitemap adds every /explained/$id from getUkStats.
- Data fixes go in uk-stats.functions.ts (category, source labels, street-crime scope label, future-date guard, stale next-release flagged "overdue"), /support source list, and a redirect for /api.
- Launch kit is static copy in agents.tsx, built from verified research.
