# Fix the foreign aid stats

## What I found
- The page and its history pages load real figures on both the preview and ukstats.co.uk. They match the OECD's own data: 2025 £13.04bn (0.43% of national income), 2024 £14.08bn, 2023 £15.34bn.
- Gaps against the site's own rules:
  - No "next release" date is shown (every figure must show one).
  - 2025 isn't marked as provisional, and the page never says when the data was last checked.
  - The "Provisional UK aid spend" link points to the 2024 release. The 2025 release address doesn't exist yet, so the link needs to go to the government's collection page instead.
  - The source is a single 30-second request with no saved copy. If the OECD is slow, the page shows "No live feed" even though we had the figures earlier.
  - The history page for the share-of-national-income figure showed no percentages when I checked it, so that needs looking into.

## Changes
1. Keep a saved copy of the aid figures (refreshed nightly, same pattern as other sections). Show the saved copy when the OECD is slow, with its date, instead of "No live feed".
2. Show the issuing body, latest year, a "provisional" tag on the newest year, the date the data was last checked, and the next scheduled releases: FCDO provisional figures (April) and final figures (autumn), taken from the government's release calendar. If no date has been announced, it will say "Not announced".
3. Fix the FCDO links so they point to the live collection and release pages.
4. Fix the share-of-national-income history page so it lists its percentages.
5. Check the layout at your screen width (743px) and on a phone. Make sure the summary cards, chart and table don't squash or overlap.
6. Add tests: grant-equivalent figures from 2018 and net figures before that, never mixed in one year, plus the provisional tag on the latest year.

## Technical details
- Parser moves to a pure module (`src/lib/foreign-aid.ts`); fetch goes in `foreign-aid.server.ts`, saved as payload_cache "foreign-aid-v1". It's read before contacting the OECD and serves the last good copy on failure. A nightly cron calls `/api/public/foreign-aid-tick`.
- `getForeignAid` and the register `foreignAid()` metric both read from that saved copy, so the home page card and this page always agree.
- Next-release dates come from the GOV.UK research-and-statistics release calendar search for "Statistics on International Development". Nothing is hard-coded or guessed.
