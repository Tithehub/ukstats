# Irregular immigration: age and sex demographics

Add an official demographic breakdown of small boat arrivals to the irregular immigration area of the dashboard, taken verbatim from the Home Office workbook — no modelling, no estimates.

## Source (verified)

Home Office, *Immigration system statistics* data tables → **Illegal entry routes to the UK summary tables** (currently `illegal-entry-routes-to-the-uk-summary-jun-2026-tables.ods`), worksheet **IER_02c — "Small boat arrivals, by age group and sex"**, covering January 2018 onwards.

The table publishes, per calendar year, for each age band (17 and under, 18 to 24, 25 to 39, 40 and over) a Male / Female / Unknown split, plus "Not currently recorded" and a Total row. The workbook also carries its own published date and next planned update date, which the cards will use.

## What gets added

A new group of cards inside the existing "Irregular immigration & cost" category, headed as the demographic breakdown of small boat arrivals:

1. **Male share of small boat arrivals** — count and share of the latest full published year.
2. **Female share of small boat arrivals** — count and share of the same year.
3. **Sex not recorded** — count, shown only as published (combines the "Unknown" rows and "Not currently recorded").
4. **Children (17 and under)** — count and share.
5. **Adults 18 to 24**, **25 to 39**, **40 and over** — count and share.

Each card shows a small stacked bar of the age bands or the sex split, the reference year, publication date, data age, and the workbook's own "next planned update" date, plus a link to the official table. The year-part period (e.g. "2026 January–March") is labelled as partial and never annualised.

Where the workbook shows a zero or a suppressed value, it is displayed as published. If the workbook cannot be read, all demographic cards render the standard unavailable state with the source link — never a fallback number.

## Presentation

- The cards stay in the "Irregular immigration & cost" category so irregular immigration and its cost remain on one page, with a sub-heading separating "Arrivals", "Demographics" and "Cost" groups.
- Each demographic card is individually embeddable and selectable in the widget builder and the shareable live page, like every other metric.
- Wording states "small boat arrivals" specifically, because the age/sex table covers the small boat route only, not all detected illegal entry routes.

## Technical notes

- New normalizer in `src/lib/uk-stats.functions.ts`: locate the latest "Illegal entry routes to the UK summary tables" attachment via the GOV.UK content API for `/government/statistical-data-sets/immigration-system-statistics-data-tables`, download the ODS, and parse worksheet `IER_02c` from `content.xml` using the existing zip/spreadsheet helpers already used for the Home Office accounts workbook.
- Parse the published date, "Next update" date and table title from the cover sheet so freshness and next-due are the workbook's own, not inferred.
- Add an optional `breakdown` field to `Metric` in `src/lib/uk-stats.ts` (ordered label/value parts) and render it in `MetricCard` as a proportion bar with labels; existing metrics are unaffected.
- Add the group sub-heading rendering in `src/routes/index.tsx`, and include the new metric ids in `/widget` and `/embed`.
