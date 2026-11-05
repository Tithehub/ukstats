# Public spending: councils and government, by area

A new "Spending" section under the current stats that goes deeper: where public money goes, for every council area and region in the UK, split into every type of expenditure the official returns use. Every figure and link goes to the official publisher. Nothing estimated.

## What visitors will see

**1. /spending — the hub**
- UK government spending by type (HM Treasury PESA, "spending by function"): health, education, social protection, defence, public order and safety, transport, housing, environment, debt interest, and so on, each with the year, publisher and release date.
- Spending per person by nation and English region (HM Treasury Country and Regional Analysis), shown side by side.
- A search box: type a town, city or council and go straight to its page.

**2. /spending/$council — one page per council (all ~380 UK councils)**
- Council's own spending split by service, using the categories in the official returns:
  - England (MHCLG revenue outturn): education, highways and transport, children's social care, adult social care, public health, housing, culture, environmental and regulatory (incl. waste), planning, police, fire, central services, other.
  - Scotland (Local Financial Returns), Wales (StatsWales revenue outturn), Northern Ireland (Department for Communities council accounts) — their own categories, labelled as such, never forced to match England.
- Live links to that council's own published records:
  - "Spending over £500" payment lists (required by the Local Government Transparency Code) — direct link where checked, otherwise the council's transparency page.
  - Annual statement of accounts and budget book.
  - The council's Freedom of Information request page, plus its public FOI log on WhatDoTheyKnow.
- If a council has not published a figure, it shows "Not published" and the source link.

**3. /spending/type/$category — one page per expenditure type**
- e.g. "Adult social care": every council ranked by spending per person in its nation, with ties kept and missing councils listed separately, not ranked.

**4. FOI guide box** on each page: how to ask for spending data the council hasn't published, links to the council's FOI page, ICO guidance and WhatDoTheyKnow. Plain language, no templates that imply a legal guarantee.

Linked from the site menu, the UK topic bar, region pages (/regions/$slug link to their councils) and the sitemap.

## Rules kept
- Only official figures; originals linked; publication date, period, data age and next release on every figure.
- Nations shown separately where categories differ; never summed across different returns.
- Per-person figures only when both spending and population come from official releases for the same year.
- Council links checked before adding, with the check date stored. Links we couldn't confirm go to the council's main transparency page instead.

## Honest limits
- Council payment lists are spreadsheets in hundreds of formats; we link to them, we don't turn them into figures.
- Town level: spending is published per council, not per town. A town search lands on the council that covers it.
- FOI answers aren't published data; we link to them, never quote them as statistics.

## Technical details
- `src/lib/spending.ts` (pure parsers + category list), `src/lib/spending.server.ts` (fetches MHCLG ODS/CSV, StatsWales OData, Scottish LFR, NI, PESA tables), cached in payload_cache "spending-v1" with lastGood served during refresh; POST server functions.
- `src/lib/councils.data.ts`: council directory (ONS codes, nation, region, website, transparency, accounts, FOI and WhatDoTheyKnow links, checked date).
- Routes: `spending.tsx` (layout), `spending.index.tsx`, `spending.$council.tsx`, `spending.type.$category.tsx`, each with its own head().
- Tests: category mapping per nation, "Not published" on missing values, no cross-nation totals, ranking ties and exclusions.
- AGENTS.md rule for the spending module.
- Build in stages: hub + PESA first, then England councils, then Scotland/Wales/NI, then type pages.
