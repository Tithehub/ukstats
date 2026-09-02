# Simplified home page — dark "UKStats" theme

Your reference image settles the design direction, so no more prototype rounds. The current dense register stays exactly as it is, moved to its own route; the new home page becomes the calm, dark, at-a-glance front door.

## What you get

**New home page (`/`)** — dark navy canvas, electric blue accent, in the style of your reference:

- Top nav bar: UKStats mark, links (Home, Data, Charts, Reports, About), and the existing Create / Widget / My pages actions.
- Hero: "Discover the UK in Numbers" style headline with a short subline, two buttons — Explore stats (to the full register) and View live data. A subtle abstract data-network backdrop on the right, generated as an image asset (no map claiming to show real geography).
- A three-panel capability strip: Live dashboards, Embeddable widgets, Shareable live pages.
- "Key indicators at a glance": 4–6 cards, each with a headline figure, inline sparkline, source, reference period, freshness dot and next-release date — all drawn from the live feeds already running, never invented.
- Alert dials row: terrorism threat, Met Office warning, flood warnings, air quality — each on its issuing body's own published scale, rendered as an arc dial with the named steps.
- Collapsible category containers (Finance, Cost of living, Crime, Immigration, Irregular immigration, Housing, Weather, Defence). Collapsed row shows headline value + sparkline + freshness; expanded shows the small chart grid and source lines.
- Footer in the reference's four-column form (Data / Insights / About / Support) plus the "independent aggregator, not a government service" line.

**Full register moves to `/register`** — byte-for-byte the page you have today, unchanged, linked from the hero, nav and each category container. The old URL keeps working via a redirect so nothing you've published breaks.

## Data rules (unchanged)

Every figure on the new page comes from the existing live metric feeds. No estimates, no placeholders. Where a feed has no value, the card shows the same explicit "Not published" / "No live feed" state it does today, with the source link and dates.

## Technical notes

- `src/routes/index.tsx` becomes the new simple home; today's content moves verbatim to `src/routes/register.tsx` with its own `head()` metadata, and `/` gets fresh title/description/OG tags.
- New dark tokens added to `src/styles.css` (`--color-night`, `--color-night-panel`, `--color-electric`, plus dark-surface variants of the freshness colours) — scoped to the new page so the register keeps its light theme.
- New components: `HeroBand`, `IndicatorCard` (sparkline via inline SVG), `AlertDial` (arc + named official steps), `CategoryPanel` (disclosure + small multiples).
- Reuses the existing `statsQuery` loader and `Metric` shape; no changes to `uk-stats.functions.ts`, no schema or backend changes.
- Hero backdrop generated as a project image asset and referenced with an `og:image` on `/`.
- Sitemap gains `/register`.

## Open item

The crime feed occasionally returns a rate-limit error from ONS; the retry already added handles most cases and I'll confirm those cards render on the new page before finishing.
