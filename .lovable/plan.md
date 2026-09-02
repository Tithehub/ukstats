# Full history, a proper cost-of-living breakdown, sharing and donations

Three things: every metric gains its full published history (as far back as the source goes), the cost-of-living section is broken into the household categories you listed, and the page gets a vital-stats strip at the top, full social sharing, and a crypto donation link.

## 1. Historical data, everywhere

Today each card carries only a short sparkline (last 10–14 points). Change that so each metric keeps its **entire published series** — for ONS series that is typically back to the 1950s–1990s, for Land Registry back to 1968, for small boats back to 2018, for Police recorded crime back to 2002/03.

- Every card gets a **click-to-expand chart**: full line chart, hoverable points showing value + exact period, and range buttons (1Y / 5Y / 10Y / Max) built only from real published points. Gaps stay gaps — no interpolation.
- Under each chart: first published point, last published point, number of observations, and the source link to the exact series.
- A new **/history/$metricId** page per metric with the full chart, a paginated table of every published observation, CSV download of that table, and its own metadata and share links.
- Where a body publishes no back series (alert levels, status feeds), the card says so explicitly instead of faking depth.

## 2. Cost of living, categorised

Replace the single "Cost of living" block with named sub-sections, each built from published ONS/regulator series:

- **Household shopping** — food & non-alcoholic drink price index and annual rate, alcohol & tobacco, plus published everyday item prices where ONS publishes them.
- **Energy & fuel** — Ofgem price cap history (per year, and the underlying unit rates/standing charges as published), electricity and gas price indices, and DESNZ/RAC weekly road fuel prices (petrol/diesel pence per litre).
- **Council tax** — MHCLG average Band D council tax by year, England, with the published annual increase.
- **Telephone & internet** — ONS communications price index, plus Ofcom's published average monthly spend where machine-readable.
- **Water and sewerage** — Ofwat/Water UK average annual household bill by year and the published percentage change.
- **House prices** — UK HPI average price, annual change, plus first-time buyer and existing-owner splits and the published rent index.
- **Travel costs** — rail fares index (published regulated fare rise), bus and coach fares index, motoring/vehicle running costs index, air fares index.
- **Also worth adding** (same rules): mortgage/Bank Rate history, average weekly earnings vs CPI (real pay), rent index, childcare costs, insurance (motor/home) price index, and the overall CPIH weights so a visitor can see what share of a household basket each of the above represents.

Each category is a collapsible container with its own headline figure, mini-chart, and the per-metric cards inside — matching the containers already on the home page.

## 3. Vital stats at the top

A pinned "Vital signs" strip above everything on both home and register: national debt, CPI inflation, Bank Rate, unemployment, average house price, small-boat arrivals YTD, current terrorism threat level. Each with value, direction, age dot and next-release date. It stays visible as a slim sticky bar on scroll.

## 4. Sharing to all socials

Every page, category and individual metric becomes shareable:

- Share row on the home page, each category, each metric card and each /history page: X, Facebook, LinkedIn, WhatsApp, Reddit, Telegram, Bluesky, Threads, email, and copy-link.
- Per-metric share links carry the metric in the URL so the recipient lands on that figure.
- Real, per-page og:title / og:description with the live figure and its source, so a shared link previews the actual number and where it came from.
- Existing shareable live pages (/p/$slug) get the same expanded share row and can now include the new cost-of-living categories.
- Source links are preserved verbatim everywhere, including in the shared card copy — no shortened or proxied links.

## 5. Crypto donations (MetaMask)

A Support page and a footer link:

- Donation panel listing your wallet addresses per network (Ethereum, Polygon, Base, Bitcoin — whichever you give me), each with a QR code and copy button.
- A "Donate with MetaMask" button that opens MetaMask with the address and an editable amount prefilled, falling back to the copy/QR view when no wallet is installed.
- Addresses live in one config file so you can drop them in later; until you provide them the panel shows a clear "coming soon" state rather than a placeholder address.

## Other features worth adding

- **Compare mode** — pick any two metrics and see them on one indexed chart (e.g. wages vs CPI).
- **Alerts** — email or browser notification when a metric's next release lands or a threat level changes.
- **Data downloads** — CSV/JSON per metric and a single JSON of the whole register.
- **Public API** — a documented read-only endpoint so others can consume the register.
- **Release calendar** — every announced next-release date on one timeline page.
- **"What changed today"** — a diff feed of figures updated since your last visit.

## Technical notes

- New `src/lib/history.ts` type (`series: {period, value, iso}[]`) added to `Metric`; collectors in `uk-stats.functions.ts` stop truncating and return the whole published series. Payload size is kept sane by serving trimmed series in the main payload and the full series from a `getMetricHistory(id)` server function used by the chart/table.
- Charts via a small inline-SVG chart component (no heavy chart library), reusing the existing sparkline maths.
- Cost-of-living sub-categories become a `subcategory` field on `Metric` plus a category config in `src/lib/cost-of-living.ts`; new collectors for Ofgem cap, road fuel, council tax, water bills, comms, rail/bus/air fares.
- Sharing: one `<ShareRow />` component + `src/lib/share.ts` URL builders; per-metric head() metadata on `/history/$metricId`.
- Donations: `src/lib/donate.ts` address config, `/support` route, `window.ethereum` detection with QR fallback. No backend, no custody, no tracking of donors.
- Sitemap gains `/history/*` and `/support`.

## Rules unchanged

Every figure stays a real published figure with its source, reference period, age and next release date. Where a series does not exist, the card says so.
