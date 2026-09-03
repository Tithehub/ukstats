# Political Parties & Polling

Adds a new section covering how the country has performed under each government, where the parties stand in the polls right now, and who is officially registered as a political party. Everything keeps the current dark-first design, the live card layout with Fresh / Ageing / Overdue tags, and a named official source on every figure.

## 1. Performance by government era

A new page, `/governments`, plus a summary panel on the register.

- Era selector across the top: Conservative 1979–1997, Labour 1997–2010, Coalition 2010–2015, Conservative 2015–2024, Labour 2024–present, with an option to drill into individual prime ministerial terms inside each.
- For the selected era, five metric rows: CPI inflation, GDP, public sector net debt, total tax vs total welfare, and crime. Each row shows the published value in the month/quarter the government took office, the value when it left (or the latest published value for the current government), and the change between them.
- Every value is pulled from the same live ONS series the rest of the site already uses, read at the exact published period — no averaging, no rebasing, no adjustment.
- Crime gets equal billing as requested. Comparable published crime figures only start in 1981 (Crime Survey for England and Wales) and the police-recorded series changed basis in 2002, so pre-1981 eras show an explicit "not published on a comparable basis" cell with the coverage note, rather than a number.
- Era start and end dates come from the House of Commons Library record of UK governments and are shown with that source link.
- A side-by-side compare mode lets two eras sit next to each other.

## 2. National voting intention

A polling card on the new `/polling` page and a compact version in the register and on the home page.

- Each major pollster's own published Westminster voting-intention release is read directly: YouGov, Ipsos, More in Common, Opinium, Savanta, Find Out Now, BMG. Every poll shown carries the pollster's name, fieldwork dates, sample size and a link to that pollster's own page.
- The headline average is a plain, unweighted mean of the most recent poll from each pollster that has published within the last 21 days, with the calculation stated in words on the card and the contributing polls listed underneath. No modelling, no house-effect adjustment, no smoothing.
- Parties covered: Labour, Conservative, Reform UK, Liberal Democrats, Green Party, SNP, Plaid Cymru — each shown only where the pollster publishes it (SNP and Plaid are usually Scotland/Wales subsets, which will be labelled as such rather than merged into a UK figure).
- Freshness tag is driven by the newest fieldwork date in the average. If fewer than three pollsters have published recently, the card says so instead of pretending to an average.
- If a pollster's page cannot be read, that pollster is listed as unavailable with its link — the average is computed from the ones that were read, and the card says how many.
- The 2024 general election result is shown alongside as the last officially certified figure, from the Electoral Commission.

## 3. Registered parties registry

- Live from the Electoral Commission's own registration search: 366 currently registered parties on the Great Britain register plus the Northern Ireland register.
- Presented as a collapsible section containing a searchable, sortable table: party name, registration status, register (Great Britain / Northern Ireland / Gibraltar), registered address town, and date of registration.
- Filters for register and status; a search box that matches on party name.
- Row count, the Electoral Commission's own "generated at" timestamp, and a link to the official register.

## Navigation and plumbing

- New "Politics" nav entry with `/polling`, `/governments`; registry lives in a collapsible block on `/polling`.
- New "Politics & polling" category so the cards also appear on the register page and can be embedded as widgets like every other metric.
- Both new routes get their own metadata, canonical URL, share row, and sitemap entries.

## Technical notes

- Electoral Commission registry: `search.electoralcommission.org.uk/api/search/Registrations` (verified returning 366 GB registered parties as JSON). Cached server-side for six hours in the existing collector cache.
- Government-era values reuse `ONS_DEFS` and the existing `onsSeries` reader in `src/lib/uk-stats.functions.ts`, selecting the observation for the era's start and end period. Era boundaries are a small static table sourced to the House of Commons Library.
- Pollster pages are HTML with no public data API (YouGov and Ipsos both refuse plain server fetches). Reading them needs the Firecrawl connector, which extracts each release page into structured fields. Firecrawl is not yet connected on this project — I'll open the connect card as the first build step. Until it is connected the polling card renders its explicit "No live feed" state with links to each pollster, and everything else in this plan works regardless.
- New collectors added to `src/lib/uk-stats.functions.ts` and registered in `collectStats()`; new routes `src/routes/polling.tsx` and `src/routes/governments.tsx` follow the `/tax-vs-welfare` structure; `SiteHeader` and `sitemap[.]xml.ts` updated.
