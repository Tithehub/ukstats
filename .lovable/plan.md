# Hide horse racing from the live site, then polish the new Globe Orbit stream

## Part 1 — Keep horse racing off the live site until you say so
- Remove every racing link from the menu, the UK topic bar and the home page on the live site.
- On ukstats.co.uk, stats.solutions and the published lovable.app address, every /racing page shows "Page not found" and is kept out of Google: removed from the sitemap and marked noindex.
- In the preview, racing keeps working exactly as now (dashboard, racecards, AI Predictor), so you can keep building it.
- One switch turns racing on. When you say "launch racing", I flip it, and all the links and pages come back in one go.

## Part 2 — Get the Globe Orbit stream nailed and modernised
This is the new stream at /globe/broadcast?layout=orbit only. The current live stream stays untouched.

Fixes for the known faults:
- **Figures mid-count or showing 0** (like "17.870"): numbers count up only once the tile is on screen. They land on the exact published figure within a second, and a slow recorder or OBS can never freeze them part-way. Any figure that can't count cleanly (dates, percentages with words, "Not published") simply appears as published.
- **Overlaps:** the tiles, the presenter box, the lower-third strap, the sponsor card and the ticker each get fixed zones on the 1920×1080 frame, so nothing overlaps or gets cut off. The on-screen overflow checker in Stream Studio flags anything that breaks.

Modernised look, same navy/red/yellow brand:
- **Cleaner tiles:** fewer at a time (max 6), larger numbers, a thin glass card, a source line and a small trend line, with a smooth slide-and-glow on the figure being read.
- **Segment transitions:** a short red/yellow wipe with the segment title (e.g. "UK DEBT", "SMALL BOATS", "WEATHER") between topics, so viewers always know what's on.
- **Globe:** a smoother fly-to between countries, a soft vignette and twinkling city lights, with the pulse ring timed to her reading.
- **Presenter:** framed lower-left in a clean glass panel with a name strap ("AI presenter"), and lip movement kept in time with her voice.
- **Ticker and clock:** a slim bottom ticker with official warnings in red and headlines in white, plus a live London clock and LIVE badge.
- **Sponsor and recommended cards:** one at a time, bottom-right, with a large QR code, never covering figures.

How I'll check it, cheaply: I'll take still screenshots of each segment type (stats, headlines, weather, warnings, migration, world, sponsor break) at 1920×1080 and check them for overlaps, blank tiles and mid-count figures. I won't make another long video recording unless you ask.

## Technical details
- Add a `RACING_PUBLIC = false` flag in src/lib/racing/visibility.ts, with `racingVisible(host)` true on preview hosts or when the flag is on. This gates the links in SiteHeader, UkTopicNav and index.tsx, the sitemap entries, and a shared `beforeLoad` on racing routes that throws notFound() on public hosts, plus a noindex head. Read the host via site-host.ts.
- Orbit: CountUp starts on IntersectionObserver/mount and also snaps to the final value through a wall-clock timeout, never frame-dependent. countUp() returns the exact string for values with more than one number. Add a test to stream-orbit tests asserting that p=1 returns the exact value and that multi-number strings pass through unchanged.
- Layout zones as fixed CSS grid areas in BroadcastView's orbit variant. tilePage is capped at 6.
- Update AGENTS.md: racing is hidden on public hosts behind one flag.
