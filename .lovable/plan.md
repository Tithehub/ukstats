# Horse racing: example horses, real courses, new look

## What you'll see
- **Example racecards, horses, trainers, jockeys and results** fill every racing page until the paid feed is connected. Every example item is clearly marked with a gold "EXAMPLE — not real racing data" badge, plus a banner at the top of each page. Example horse names are invented (e.g. "Harbour Lantern"), so none can be mistaken for a real horse, trainer or jockey.
- **All real UK racecourses**: the 59 licensed courses in Great Britain (Ascot to York) plus Down Royal and Downpatrick in Northern Ireland. Each one shows its real name, town, nation, flat/jumps/both and surface (turf, all-weather), with a link to its official website. Course facts come from the BHA course list, and the date they were checked is shown.
- **New racing look**: deep racing green, gold and cream, with jockey-silk colour stripes on each runner and a turf-and-rail pattern on the headers, replacing the plain navy on racing pages only. The rest of the site keeps the Restore Britain navy.
- **Our own images, so no copyright issues**: 4–5 new pictures (racehorses on the gallops, the finishing post, a parade ring, silks on a peg, horses jumping a fence), with no real people, logos or course branding. They appear on the dashboard, horse pages, results and competitions.
- When the paid feed is connected, the example data switches off on its own and real data replaces it. Examples never appear in the register, PDF reports, the stream, embeds or share images.

## How this fits the "no made-up stats" rule
The example data is never shown as a real result, a real horse or real odds. It is always labelled, kept separate from real data, and switched off once a feed exists. I'll save this exception as a project rule.

## Technical details
- `src/lib/racing/racecourses.data.ts`: a dated snapshot of the 61 real courses (name, town, nation, codes, surface, official URL), loaded into the `racecourses` table through a migration insert.
- `src/lib/racing/demo.data.ts`: a fixed example set (about 6 meetings at real courses, about 40 runners, 12 trainers, 12 jockeys, form history, ratings and results). Dates are relative to today in London time. There are no odds and no SP-based points shown as real.
- The server functions return demo data only when `PROVIDERS` has no configured provider, with an `isDemo: true` flag. `RacingLayout` shows the banner and an `ExampleBadge` component; the `NoFeed` notice stays on the admin page.
- Tokens: `--racing-green`, `--racing-gold`, `--racing-cream` and a silk palette in styles.css (both light and dark modes), applied through a `.racing` scope.
- Images are generated into `src/assets/racing/`.
- Tests: demo data is used only when no provider exists; demo data is never mixed with real data; there are exactly 61 courses, each with a unique name.
