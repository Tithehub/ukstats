# Horse Racing section — Stage 1 (foundation)

Your spec has five stages. This plan covers Stage 1 only, so we can check it works before spending credits on the rest.

## The one thing that blocks real data
There is no free, official feed for UK racecards, results or bookmaker odds. The British Horseracing Authority and Weatherbys only license data commercially, and odds need a paid licensed provider. Scraping racing sites breaks their terms, so we won't do it.

Until you choose and pay for a provider (for example The Racing API, roughly £30–£100 a month, or Weatherbys/BHA on a commercial licence), every page will say **"No live feed — data provider not connected"**. It will never show made-up horses, odds or results, because that's the site's core rule.

## What Stage 1 builds
- **Menu:** a "Horse Racing" group (Dashboard, Today, Tomorrow, Upcoming, Horses, Trainers & Jockeys, Results, AI Performance) plus a "Competitions" group. Both are linked from the menu, the topic bar and the home page.
- **Racing dashboard:** shows counts of meetings, races, runners and non-runners, the next race, the latest results and the feed's health. Each count comes from the database only, so with no feed it shows the "not connected" status.
- **Racecards:** today, tomorrow and upcoming meetings, with filters for course, time, distance, race type, going and status. Each runner shows its age, sex, trainer, jockey, weight, rating, draw, form and headgear, plus columns ready for odds and the AI pick.
- **Horse, trainer and jockey profiles:** career records, last five runs, the full history and charts. Every percentage also shows how many races it's based on.
- **18+ and responsible gambling:** a clear 18+ notice and links to GambleAware and GamCare. There are no betting links, no bookmaker accounts and no payments anywhere.
- **Admin page (admins only):** provider status, last import, errors and an audit log.
- **Design:** deep navy with restrained gold, matching the UKStats look. No casino-style graphics.

## Later stages (not in this plan)
- Stage 2: connecting the provider you choose, imports, non-runner monitoring and odds history.
- Stage 3: AI predictions from a statistical model with locked versions. They won't be invented by a chatbot.
- Stage 4: the free competition against the AI (10 points per winner plus a Starting Price bonus), leaderboards and achievements.
- Stage 5: testing and launch.

## Technical details
- New tables in the existing database (racecourses, meetings, races, horses, horse_aliases, runners, trainers, jockeys, race_results, non_runners, odds_snapshots, data_sources, data_import_logs, audit_logs). Each gets its grants and row-level security: anyone can read, and only the server or admins can write. Each horse keeps its stable provider ID.
- A provider adapter interface in `src/lib/racing/providers/` with no provider hardcoded. API keys are read from secrets.
- Public routes under `/racing/*` read through POST server functions, and the admin page sits under `_authenticated` with a `has_role` check.
- Pure helpers (form parsing, win % with sample size, SP points formula prepared for Stage 4) come with tests.
- A rule goes in AGENTS.md: racing figures only come from licensed provider imports and are never generated.
