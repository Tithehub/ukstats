# Connect The Racing API to the horse racing pages

## What you'll see
- Real racecards for today, tomorrow and the coming days at UK courses: real horses, trainers, jockeys, draw, weight, rating, form and non-runners.
- Real results from the last 7 days. Each horse, trainer and jockey page builds up a real race history as results arrive.
- The gold "EXAMPLE" notice and the invented horses disappear automatically once real data loads. If The Racing API is ever down, the pages show the last data they received, with its time, instead of going back to examples.
- Odds and starting prices appear only if your Racing API plan includes them. If it doesn't, they stay as "No licensed feed".
- The admin racing page shows the connection status, the last import, how many records came in, and any errors.

## Your login
- Your username and password are stored as private backend secrets: they never go in the site's code and are never shown on any page. Because they were pasted into chat, consider changing the password in your Racing API account afterwards and sending me the new one.

## Steps
1. Store the two credentials securely.
2. Make one test call to find out which data your plan includes (racecards, results, odds), then build only those parts.
3. Import UK and Northern Ireland meetings into the racing database, matched to the 61 real courses.
4. Refresh automatically: racecards every 30 minutes on race days, and results every 15 minutes during racing hours.
5. Check the dashboard, a horse page and the results page in the browser with real data before reporting back.

## Technical details
- Secrets: RACING_API_USERNAME and RACING_API_PASSWORD (HTTP Basic auth for api.theracingapi.com), read only inside server handlers.
- New provider adapter `src/lib/racing/providers/theracingapi.server.ts`, implementing RacingProvider and registered in PROVIDERS; configured() is true only when both secrets are set. The current `RACING_DEMO = PROVIDERS.length === 0` check stops working once the adapter is registered, so the demo switch will instead come from a server-side "has the provider imported data" check returned with each response.
- Import route `src/routes/api/public/racing-tick.ts`, protected by a generated secret and triggered by pg_cron. It upserts racecourses, meetings, races, runners, horses, trainers, jockeys, non-runners and results using the provider's own IDs, logs each run to racing_import_logs, and updates racing_data_sources.
- Pure mapping functions with tests: going, distance (furlongs to yards), race type, weight in stones and pounds, and non-runner flags.
- Before display, check The Racing API's terms on showing their data publicly and add a source credit if they require one.
