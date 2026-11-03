# 3D Globe with unrest hotspots

## What you'll get
A new **Globe** page (in the site menu) with a full-screen, Google Earth-style 3D globe you can spin, zoom and click.

- **Click a country**: a side panel shows its key statistics with source and year, plus links to its country profile and rankings.
- **Colour by a ranking**: pick any of the 20 World Bank indicators to shade countries. Countries with missing or stale data stay grey and are labelled that way.
- **Unrest layers** (you can switch each on or off, clearly labelled):
  1. **Official government warnings**: UK Foreign Office and US State Department travel advice per country, showing warning level, the date it was last updated and a link to the original page.
  2. **Research layer (ACLED)**: dots for recorded riots and protests, marked "Independent research, updated weekly, not a government source". Needs a free ACLED account key from you. Until you add one, this layer says "Not connected".
- **Live coverage links**, in two separate lists per country:
  - Official: national police and interior/home ministry pages and accounts (each link checked before it's added).
  - Major news live pages: Reuters, AP, BBC and similar, labelled "News coverage, not official".

## Ground rules
- No hotspot appears unless a source actually published it. Unconfirmed reports (for example a coup claim) only show up if a government warning or ACLED records them.
- Every hotspot shows its source, date and data age, and older items are marked as ageing or overdue.
- Political sponsors and Restore Britain panels are not shown on the globe.

## Technical details
- three.js with React Three Fiber and drei, loaded only in the browser on a new `/globe` route. Country shapes come from a bundled Natural Earth file.
- `src/lib/unrest.ts` has pure parsers for the FCDO content API, the State Dept advisories feed and ACLED events, with tests. `src/lib/unrest.server.ts` fetches them, and a POST server function caches results in payload_cache `unrest-v1` (refreshed hourly, serving the last good copy while it refreshes).
- `src/lib/live-sources.data.ts` holds the verified official and news links per country.
- The World Bank colours reuse the cached `world-bank-v2` data.
- Also: a sitemap entry, the page head metadata and an AGENTS.md rule. The page goes to preview first and is published only when you ask.
