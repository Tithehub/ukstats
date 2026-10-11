# Images for life + social-media convictions comparison

## 1. Default images
Generate a small, consistent set of editorial photos that fit the existing "civic instrument" look (muted, slightly desaturated, ink/steel tones — no stock-photo smiles, no fake charts or numbers in any image).

- Home: a wide banner (Westminster / London skyline at dusk) behind the intro.
- Topic banners: crime, economy and debt, cost of living, migration and borders (Channel coastline), defence, weather, housing.
- Countries index and each country page: one banner per region (Western, Northern, Southern, Central/Eastern Europe, North America, Australia) so all 33 pages get a picture without 33 lookalikes.
- Images are decorative only: they never contain figures, flags with text or anything that could be read as a statistic. Each has proper alt text.

## 2. Social-media convictions, country by country
New page "Online speech convictions" linked from Compare countries.

Rule kept: only published official counts. Where a country publishes no comparable count, its row says "Not published" with the source link — nothing estimated.

- UK (England and Wales): Ministry of Justice "Outcomes by offence" data — convictions under Communications Act 2003 s127 and Malicious Communications Act 1988 s1 (and Online Safety Act 2023 offences once they appear), by year. Clear note that these offences cover all electronic messages, not only social media, because MoJ does not split out social media.
- Scotland: Scottish Government criminal proceedings tables for the s127 offence, where published.
- Germany: Federal Statistical Office prosecution statistics (e.g. §130 incitement, §185 insult) — shown only with a clear note that these are not online-only.
- Other countries: listed with "No comparable official series" plus a link to their justice statistics office.
- Each row shows source, period, data age and next release, matching the rest of the site. Per-100k rate shown only where both count and population are official.
- Because offence definitions differ by country, the page leads with a plain warning that the rows are not like-for-like.

## Technical details
- Images via image generation into src/assets, imported per route; lazy-loaded below the fold.
- New route `/online-speech`, data module with source registry; UK figures read from the MoJ published CSV at load with last-good snapshot fallback, same pattern as other UK feeds. If a source cannot be parsed reliably, it shows "No live feed" rather than a typed-in number.
- Tests: no row ever shows a value without a source URL and period; non-like-for-like note always present.
