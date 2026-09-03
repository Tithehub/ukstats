# Daily Statement — a written record of the UK's numbers, one day at a time

Each day the site writes a short, plain-English statement built strictly from the figures published that day, stores it permanently, and publishes it in its own browsable archive.

## What gets built

**1. The daily statement**

Once a day, after the figures are collected, the site composes a dated statement:

- An opening line naming the date and how many official figures moved.
- A paragraph per changed figure: what it is, its new value, its reference period, its previous value, direction of movement, and the body that published it.
- A closing "where things stand" paragraph listing the pinned vital signs (debt, inflation, population, net migration, unemployment, house prices, irregular arrivals, terror threat) with their reference periods.
- On a quiet day with no releases, the statement says so plainly and still records the vital signs.

Every sentence is assembled from stored published values with fixed templates — no wording invents, rounds, estimates or characterises a number beyond what the publisher stated. Each figure in the statement carries a link to the issuing body's own release.

**2. Public history section at `/daily`**

- Latest statement in full at the top.
- Reverse-chronological archive of every past day, with a year/month filter and a search box over titles and figures.
- Each day also has its own permanent page at `/daily/<date>` (e.g. `/daily/2026-09-03`) — shareable, printable, with the full source list, the sharing row used elsewhere on the site, and its own social preview metadata.
- Copy-as-text and CSV of the day's figures.
- Dark-first with the existing light toggle, same header/footer/typography as the rest of the site.

**3. Discoverability**

- Header and footer navigation entries.
- Each day's page added to the sitemap; the `/feed.xml` feed gains the daily statement as an item.
- The homepage gets a compact "Today's statement" strip linking to `/daily`.

## Technical notes

- New table `daily_briefings`: `briefing_date` (unique), `headline`, `body` (the composed statement), `figures` (JSONB array of the day's figures with value, previous value, period, source, source URL), `change_count`, `created_at`. Public read via a narrow `TO anon` SELECT policy; writes restricted to `service_role`. Grants issued in the same migration.
- Composition lives in `src/lib/daily.ts` (pure template functions, unit-testable) and `src/lib/daily.functions.ts` (public server functions: latest, list by month, get by date).
- Generation is folded into the existing scheduled sweep at `/api/public/outreach-tick`, which already compares snapshots and records `metric_changes`; it will upsert one row per London date after recording changes, so re-runs on the same day refresh rather than duplicate. A pg_cron entry runs it daily if one is not already scheduled.
- Routes: `src/routes/daily.tsx` (archive) and `src/routes/daily.$date.tsx` (single day), both public and SSR, using public server fns in loaders with `errorComponent`/`notFoundComponent`, each with its own `head()` metadata.
- Backfill: the first run creates the first statement; earlier days are not fabricated, and the archive states plainly that the record starts on that date.
