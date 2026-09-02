# Sexual offences in detail, with official per-capita rates

Crime currently shows one "Sexual offences" card (217,567 offences, 3.52 per 1,000 population, year ending March 2026) taken from the police force area tables. That release does not break sexual offences down any further.

The ONS "Crime in England and Wales: Appendix tables" release — same publisher, same release date (22 July 2026), next release 22 October 2026 — does. It publishes:

- Table A6: rate per 1,000 population, number of offences, change vs previous year and change vs 10 years ago, for sexual offences, rape, and other sexual offences.
- Table A5a: every individual recorded sexual offence category with Home Office offence codes and year-on-year change (rape of a female aged 16 or over 51,673; rape of a female child under 16 8,308; rape of a male aged 16 or over 4,093; sexual assault on a female aged 13 and over 52,356; sexual activity involving a child under 16 12,291; sexual grooming 7,679; and the rest).
- Table A7: the published rate per 1,000 population back to year ending March 2003, for sparkline history.

## What gets added

A "Sexual offences" subgroup inside the Crime section:

1. Headline cards from Table A6 — sexual offences, rape, other sexual offences — each showing the published number, the published rate per 1,000 population, year-on-year change, ten-year change, and a sparkline of the published rate series from Table A7. A breakdown bar splits the total into rape and other sexual offences.
2. Detail cards from Table A5a for each published sexual offence category, showing the count, the Home Office offence code and the published year-on-year percentage change. Where a category is published as unavailable ([x]) or suppressed ([u]), the card says so instead of showing a number.

Rules kept: rates per 1,000 are only ever the publisher's own figures. ONS does not publish a per-capita rate at individual offence-code level, so those cards will state "rate per 1,000 not published at this level of detail" rather than have one calculated here. Every card carries source, reference period, publication date, age and the 22 October 2026 next release.

## Technical notes

- New `sexualOffences()` collector in `src/lib/uk-stats.functions.ts`, resolving the latest appendix-tables version through the ONS dataset JSON API (no hardcoded year), downloading the XLSX and parsing sheets A6, A5a and A7 with the existing `fflate` + sheet-parsing helpers already used by `recordedCrime()`.
- Registered alongside `recordedCrime()` in the stats task assembly; failures return an empty list so the rest of the page is unaffected.
- `src/routes/index.tsx` gains a "Sexual offences" subgroup heading in the Crime section, placed after "Offence groups and rates". The existing P1 total stays where it is.
- No schema, payment or widget changes; the new metrics are embeddable and page-shareable like every other card automatically.
