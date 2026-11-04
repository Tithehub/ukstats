# UKStats Live — news-channel look for the YouTube stream

Turn the stream page into a TV news channel layout, using only the figures, warnings and reports the site already pulls. Nothing new is invented and every figure on screen carries its source and date.

## What viewers will see (1920×1080)

```text
+--------------------------------------------------------------+
| UKSTATS LIVE [logo]   SEGMENT TITLE        LIVE  00:09 London |
+-----------------------------------------+--------------------+
|                                         |  STAT OF THE MOMENT|
|            3D GLOBE                     |  big figure        |
|   (flights, boats, warnings, reports)   |  source · period   |
|                                         |  next release      |
|                                         +--------------------+
|  lower third: headline + source + time  |  UP NEXT list      |
+-----------------------------------------+--------------------+
| BREAKING / LATEST ticker (official warnings, then news)      |
| UK STATS bar: debt · inflation · boats YTD · crime · ...     |
+--------------------------------------------------------------+
```

1. **Channel header** – navy branded bar: "UKStats Live" logo, current segment name, red LIVE badge, London clock.
2. **Segment rundown** – a repeating running order, each segment about 60–90 seconds:
   - UK headline numbers (debt, inflation, cost of living, unemployment)
   - Small boats today and year to date (globe zooms to the Channel)
   - Crime and immigration figures
   - World warnings: protests, strikes and war zones from UK/US government advice
   - Flights: emergency planes right now
   - Migration routes (Frontex, US border, UN refugees side by side)
   - World rankings: where the UK sits
   - News & police reports (labelled as news, not official)
3. **Stat card ("big number")** – one figure at a time with its source, reference period, data age and next release date, using the same freshness colours as the site.
4. **Lower third** – the current headline or warning in the publisher's own words, with publisher name and time.
5. **Two tickers at the bottom** – a red "Latest" strip (official warnings first, then news) and a slower navy bar of UK key stats.
6. **"Up next"** list and a small "Source: ukstats.co.uk" bug, all placed above YouTube's player-button zone (fixes the earlier cover-up issue).
7. Smooth transitions (slide/fade) between segments; reduced motion respected.

The studio preview page will show this exact layout, with the cover-up zones still switchable.

## Rules kept
- Only figures already in the register or globe data; if a figure is missing it says "Not published" and is skipped from the rotation.
- No ads, sponsors or donation asks (legal hold).
- No sound added.

## Technical details
- New pure rundown builder `src/lib/stream-rundown.ts` (segments from existing UK stats, migration, flights, unrest, news payloads; skips segments with no data) plus tests.
- New overlay components under `src/components/stream/` (Header, StatCard, LowerThird, Tickers, UpNext); the segment drives GlobeExplorer state (country/camera, layers).
- Update `src/routes/globe_.broadcast.tsx` to render the overlay; studio page reuses it unchanged. Watchdog reloads kept.
- Browser check at 1920×1080 for layout and console errors; preview only until "publish".
