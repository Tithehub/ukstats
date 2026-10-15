# Bring top-ten city crime rankings to more countries

## Why only Canada has rankings today

The `/safest-places` page promises top tens for every country, but only Canada shows one. The other 33 countries show an honest "Ranking unavailable" note because no comparable official town-and-city feed was connected yet. Official town/district-level data **does** exist for two more countries:

- **UK** — ONS "Police Force Area" tables include recorded crime by Community Safety Partnership area, which in most cases equals a local authority (hundreds of areas, rates per 1,000 population, quarterly; latest edition year ending March 2026).
- **US** — FBI Crime Data Explorer publishes CIUS Table 8, "Offenses Known to Law Enforcement by State by City" — offence counts and populations for hundreds of individual cities. FBI data is at least a year old; the page will say so.

Everywhere else (Australia, EU countries, etc.) only publishes regional or capital-only figures — a per-country top ten cannot be built honestly, so those keep their "not available" note.

## What we will build

1. **UK rankings (England and Wales).**
   - New pure parser in `src/lib/city-crime.ts` for the ONS Police Force Area workbook's Community Safety Partnership table, ranking by recorded offences per 1,000 population.
   - Reuse the existing ONS xlsx reader (sheet + shared-strings parsing already in `src/lib/uk-stats.functions.ts`) in a new loader inside `src/lib/city-crime.server.ts`, with the same 6-hour cache pattern as Canada.
   - Geography label says clearly "England and Wales community safety partnerships (local authority areas)" — Scotland and Northern Ireland publish in separate formats, so mixing them would not be an honest single table.
   - Same all-or-nothing rules as Canada: at least 20 areas, any missing/suppressed value blocks the ranking, no partial lists.

2. **US rankings.**
   - Loader fetches the FBI city-agency table, computes violent-crime rate per 100,000 residents from the published counts and city populations.
   - Board labels the reference period and states plainly that FBI city data is at least a year old.
   - Same parser rules and tests.

3. **Coverage at a glance on `/safest-places`.**
   - Under the country selector, a short "Where rankings are available" line listing the connected countries (Canada, United Kingdom, United States) so visitors instantly see the answer instead of clicking through 34 countries.
   - Country pages (`/$country/safest-places`) pick the change up automatically.

4. **Honesty notes.** Each country keeps its own measure explanation (index vs rate per 1,000 vs rate per 100,000); no cross-country league table.

5. **Finish the outstanding checks.**
   - Fix the preview browser check that timed out selecting "United Kingdom" on `/safest-places`.
   - Run the new parser tests plus the existing suite, typecheck, verify UK and US boards render real tables in the preview on desktop and phone widths.
   - Publish to ukstats.co.uk and spot-check the live pages.

## Technical notes

- Pure parsers stay in `src/lib/city-crime.ts` with vitest tests; network code stays in `src/lib/city-crime.server.ts` (server-only), matching the existing city-crime split.
- Failed fetches return the honest "could not be read just now" board — never a partial ranking.
- No changes to prices, sponsors, or other metrics.
