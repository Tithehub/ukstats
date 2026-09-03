# Tax vs welfare: extend the year-by-year view to 2026

## What's there now
The page already plots every published annual figure from ONS series ANBT (total current receipts) and ANLY (net social benefits) — 80 years, currently ending at **2025** (receipts £1,198.1bn, welfare £327.8bn). ONS has not published an annual 2026 total yet; only monthly data to **July 2026** exists.

## What to change
1. **Add a 2026 year-to-date row** built by summing the published monthly ONS values for Jan–Jul 2026 (receipts and welfare). No estimation, no annualising, no projection — it is the publisher's own monthly cash figures added together.
2. **Label it clearly** as `2026 (Jan–Jul, part year)` in the chart, the table and the CSV, styled distinctly (dashed/hatched bar or lighter tone) so it is never read as a full year.
3. **Show a full year-by-year table** under the chart for every year with published data, with receipts, welfare, and welfare as a share of receipts — currently the chart only labels ~10 tick years, so the year-by-year detail is hard to read.
4. **Note the coverage** in the page metadata: last complete year, months included in the part-year row, data-as-of date, and the next ONS Public sector finances release date (already fetched).
5. Keep every official source link (ONS PSF series ANBT/ANLY, HMRC, DWP, OBR), dark/light theming, CSV download and sharing exactly as they are.

## Technical notes
- `getTaxVsWelfare` in `src/lib/uk-stats.functions.ts` currently reads only `years[]` from each ONS series. It will also read `months[]`, group by calendar year, and emit a part-year point carrying `partial: true` plus the list of months covered, only for years with no published annual value.
- `TaxWelfarePoint` gains `partial?: boolean` and `monthsCovered?: string`.
- `src/routes/tax-vs-welfare.tsx` renders the partial bar with distinct styling, adds the year-by-year table, and includes the coverage note plus the flag in the CSV.
- If ONS later publishes the 2026 annual figure, the annual value automatically replaces the part-year row with no code change.
