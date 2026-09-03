# Add income tax vs the welfare bill

## What changes

The tax vs welfare page gains a toggle above the chart:

- **Total current receipts** (current view, unchanged)
- **Income tax** — the tax people pay on their income, compared against the same total welfare bill

Switching the toggle swaps the comparison line in the chart, the headline stat cards, the year-by-year table and the CSV download. Everything else — the part-year 2026 row, the dashed styling, the sources list, dark/light theming, sharing — stays exactly as it is.

## Where the income tax figure comes from

Income tax is published by the ONS as three components of the public sector finances release, added together:

- PAYE income tax (MS6W)
- Self assessed income tax (LISB)
- Other income tax (MF6X)

For 2025 that is £275.2bn + £51.4bn − £5.2bn = about £321.5bn. This is plain addition of the publisher's own figures — nothing estimated or projected. The page states which three series make up the total and links each one, and the table footnote makes the composition explicit.

Coverage note: these components start later than the 80-year total-receipts series (the shortest runs from the late 1990s), so the income tax view shows a shorter history. Years before the components are published show as blank rather than as zero, and the coverage line states the first published year.

## Welfare side

Unchanged: public sector net social benefits (ANLY), which is the total welfare and benefits spend the ONS publishes. Welfare-as-a-share-of-income-tax is shown when income tax is the selected comparison.

## Technical notes

- `getTaxVsWelfare` in `src/lib/uk-stats.functions.ts` fetches the three income tax series alongside ANBT and ANLY, sums them per year where all published components exist, and applies the same part-year monthly logic already used for receipts and welfare.
- `TaxWelfarePoint` gains `incomeTax: number | null` (plus the part-year flag already present per row).
- `src/routes/tax-vs-welfare.tsx` adds the toggle state and reads `receipts` or `incomeTax` from the same point list; chart scaling, hover, table and CSV all derive from the selected series.
- Head metadata and the description are updated to mention the income tax comparison; sources list gains the three ONS component series links.
