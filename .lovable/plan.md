# Cost of irregular immigration — per day / week / month / year / decade

Add a dedicated cost block to the register showing the cost of asylum and irregular-migration support at five time scales, built only from figures the Home Office actually publishes.

## What gets shown

One published anchor figure plus four derived rates:

- **Year** — the audited annual total exactly as published in the Home Office annual report and accounts (asylum support / accommodation spend). This is the only figure taken at face value.
- **Day**, **Week**, **Month** — calculated from that annual total (annual ÷ 365, × 7, ÷ 12). Each card is explicitly labelled "Derived from published annual figure", names the source document and the financial year it covers.
- **Decade** — sum of the real published annual totals for the years available. The card lists which years are included and which are missing, and is marked as a partial total rather than a full decade whenever years are absent.

No figure is estimated, modelled or interpolated. If the annual total cannot be read from the source, all five cards show "Not published" instead of a number.

## Unknown-from labelling

Every card in this block carries both:

- **Covers**: the financial year(s) the money actually relates to.
- **Unknown from**: the day after the last covered period ends (e.g. "Unknown from 1 April 2025"), alongside the publication date of the source document and the next expected release date where GOV.UK has announced one.

So a reader can immediately see how much of the present is unaccounted for, not just how old the document is.

## Technical notes

- New normaliser in `src/lib/uk-stats.functions.ts` that locates the current Home Office annual report and accounts via the GOV.UK content API, reads the published asylum support / accommodation cost and the financial years covered, and returns one published metric plus derived day/week/month cards and a summed decade card.
- Extend the `Metric` type in `src/lib/uk-stats.ts` with optional `derivedFrom`, `coversFrom`, `coversTo` and `unknownFrom` fields; `freshnessOf` treats `unknownFrom` distance as the age signal for these cards.
- `MetricCard` renders a "Derived" badge and the covers / unknown-from line when those fields are present; existing cards are unchanged.
- Add a "Cost of irregular immigration" grouping so the five cards read as one set on the dashboard, and keep each individually embeddable at `/embed/<metric-id>` and selectable on `/create`.
- Existing hotel-occupancy card stays as-is; the new block sits next to it.
