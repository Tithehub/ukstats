# More public cameras on the globe (20–30 countries)

## Goal
Add official, open-data public cameras from as many major countries as possible, keeping the existing rules: public authorities only (no private, police or home CCTV), "Scene only", honest Live / Short loop / Still picture labels.

## Honest limit
Most countries don't publish live video. Many publish still pictures updated every 1–15 minutes. Some need a free access key. Every source is tested before it's added; anything that fails or blocks is left out and named in the reply. Expect roughly 15–25 countries to work, not a guaranteed 30.

## Candidate sources (tested first)
No key needed:
- Finland — Fintraffic weather cameras
- Norway — Statens vegvesen road cameras
- Iceland — Vegagerðin road cameras
- Germany — Autobahn GmbH webcams
- Spain — DGT traffic cameras
- Singapore — LTA traffic images (data.gov.sg)
- Hong Kong — Transport Department snapshots
- Taiwan — Freeway Bureau cameras
- New Zealand — NZTA highway cameras
- Canada — DriveBC (British Columbia), Alberta 511
- UK — Traffic Scotland, Traffic Wales (if open)
- USA — more states with open lists (e.g. Georgia, Florida, Utah, Minnesota)
- Japan, Netherlands, Switzerland, Estonia, Czechia, Poland, Ireland, France, Italy, Australia — checked for open feeds

Free key needed (only if you want them; you'd register and send the key):
- Sweden Trafikverket, Australia NSW / Queensland, Ontario 511, New York 511, Washington State, South Korea ITS

## What you'll see
- Cameras list gets a country picker (all working countries) instead of only London / California, with counts and "Live video only" still working.
- Each camera shows its operator, licence and update rate; live ones keep the red LIVE badge.
- Globe stays fast: zoomed out, only a sample of non-live dots shows.

## Technical details
- Widen `PublicCam.operator` to a string id; move `CAM_SOURCES` / `OPERATOR_COUNTRY` into a registry with name, url, licence, country, kind.
- One pure parser per source in `src/lib/public-cams.ts` (or `public-cams/<source>.ts`), with tests from saved sample responses.
- `public-cams.functions.ts`: fetch sources in a bounded pool, each with timeout; a failed source drops out without breaking others; cache in payload_cache with existing TTL.
- Only https images/streams accepted; HLS only from operator-published `.m3u8`.
- Update the country picker in the Cameras panel; record source list in the globe AGENTS.md.
