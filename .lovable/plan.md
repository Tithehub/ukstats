# Religion and ethnicity for irregular immigration

## What the official sources actually publish

I checked the current Home Office release (Illegal entry routes to the UK summary tables, year ending June 2026, published 27 August 2026). It contains four data tables:

- IER_01 — detected irregular arrivals by route
- IER_02a — small boat arrivals and total boats, by month
- IER_02b — small boat arrivals, by nationality
- IER_02c — small boat arrivals, by age group and sex (already on the site)
- IER_02d — asylum claims and NRM referrals from small boat arrivals

Searching the whole workbook for "religion", "religious", "ethnic" and "ethnicity" returns zero matches. The Home Office does not publish religion or race/ethnicity for irregular arrivals or small boat arrivals — the characteristics collected and released are nationality, age group and sex. There is no official feed to connect, so no religion or ethnicity figures can be shown without inventing them, which this project never does.

## What to build instead

1. **Nationality breakdown (real data, new).** Add a Nationality sub-group inside "Irregular immigration & cost", read live from table IER_02b for the same latest published period as the existing demographics. Cards for the top nationalities by arrivals in that period plus an "All other nationalities" card, each with the published count, its share of the published total, a proportional breakdown bar, publication date, reference period, data age and next scheduled release. Nationality is the closest official attribute to what was asked for — it is published, it is not a proxy for religion or ethnicity, and the cards will say so.

2. **Explicit "not collected" cards (honest gaps).** Add two cards, "Religion of irregular arrivals" and "Ethnicity of irregular arrivals", rendered in the same Demographics group with the existing unavailable styling and the value shown as "Not published". Each states plainly that the Home Office does not collect or publish this characteristic for irregular arrivals, names the release checked and its date, and links to the official data-tables page so anyone can verify. These re-check the release on every refresh, so if the Home Office ever starts publishing either characteristic the card will surface it rather than silently staying blank.

3. Both new groups stay embeddable through the existing widget builder, embed routes and shareable live pages, exactly like the age and sex cards.

## Technical notes

- Extend the existing `smallBoatDemographics` work in `src/lib/uk-stats.functions.ts` with an `IER_02b` parser that reuses the current ODS attachment discovery, `unzipSync`/`content.xml` reading and the latest-complete-period column selection, so nationality and the age/sex cards always describe the same published period.
- Nationality rows come through verbatim, including the workbook's own "Other nationalities" grouping; nothing is merged, ranked beyond sorting by the published count, or estimated.
- The religion and ethnicity cards are static-status metrics generated from the same release metadata (publication date, next update), with `status: "unavailable"` and a note explaining the absence — no placeholder numbers, no zeros.
- `src/routes/index.tsx` gains a Nationality sub-heading beside the existing Arrivals, Demographics and Cost headings.

## Verification

Typecheck, build, then load the dashboard and confirm nationality counts and shares match the published IER_02b column, and that the religion and ethnicity cards read "Not published" with their explanation and source link.
