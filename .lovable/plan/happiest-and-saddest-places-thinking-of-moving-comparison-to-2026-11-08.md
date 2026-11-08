# Happiest and saddest places + "Thinking of moving?" comparison tool

## 1. Happiest and saddest places to live (official)
New page **/happiest-places**, linked from the menu, the UK topic bar and the home page.

- Source: ONS "Personal well-being estimates by local authority" (Annual Population Survey). It covers every council area in England, Scotland, Wales and Northern Ireland: about 360 areas, including the cities and big towns.
- Four official measures, each shown with its year, source and next release date: life satisfaction, happiness, feeling that life is worthwhile, and anxiety (where lower is better).
- **Top 10 happiest** and **Top 10 saddest** (lowest happiness score), plus the full list of every area. You can search it, filter it by nation (England, Scotland, Wales, Northern Ireland), and sort it by any of the four measures.
- ONS's own warnings carry through. Where ONS marks an estimate as unreliable or does not publish it, the area shows "Not published" and is left out of the rankings. Places are council areas, not individual villages: a town is shown under its council area and labelled that way.
- "Ireland" means Northern Ireland here. The Republic of Ireland's statistics office does not publish a comparable score for each area, so it shows "No live feed" with a link.

## 2. "Thinking of moving?" quality of life tool (unofficial)
New page **/move-compare**, linked from the happiest-places page, the menu and the home page.

- Pick **who is moving**: single person, couple, family with children, or retired.
- Pick **From** and **To** places (any UK council area).
- One **"What matters most to you"** slider panel for safety, cost, happiness, schools, retirement and amenities. Each household type starts with sensible settings (for example, schools count for more for families, and health and quiet count for more for people who are retired) and you can adjust them.
- Result: a side-by-side card for each place with the real official figure behind each factor (source and date), plus one overall **unofficial score out of 100**, and a "better / worse / similar" line for each factor.
- A clear banner on the page and on every result: **"Unofficial tool, for testing purposes only. The score is UKStats' own weighting of official figures — it is not an official statistic and not advice."**
- Shareable: your choices are saved in the page link.

### Factors and their official sources
| Factor | Official figure |
|---|---|
| Safety | Recorded crime per 1,000 people (ONS for England and Wales, Police Scotland, PSNI), using the crime data we already show |
| Cost | Average house price (UK House Price Index, already pulled) and ONS median weekly pay, as a price-to-earnings ratio |
| Happiness | ONS life satisfaction and anxiety (from section 1) |
| Schools | Share of state schools rated Good or Outstanding in England (from our Education data). Scotland, Wales and NI show "No comparable figure", and that factor is left out of the score rather than guessed |
| Retirement | ONS healthy life expectancy at 65 and the share of residents aged 65 and over |
| Amenities | ONS / DfT journey times to key services (GP, hospital, town centre), England only. Elsewhere it shows "No comparable figure" |

How it stays honest:
- Each factor is turned into a 0–100 position among all UK areas, using the published figures only, with nothing estimated.
- If a factor is missing for either place, it is dropped for both and the result shows that.
- The overall score is labelled unofficial every time it appears. It is never shown in the official register, embeds, reports or the stream.

## Technical details
- `src/lib/wellbeing.ts` (pure parser for the ONS well-being file, ranking and suppression), `wellbeing.server.ts` (fetching via the ONS dataset API), cached as payload_cache `wellbeing-v1`, with a nightly refresh through the existing cron pattern.
- `src/lib/move-compare.ts` (pure scoring: percentile normalisation, weights for each household type, dropping missing factors), plus a POST server function that loads the factors for each area by joining on ONS local authority code. It reuses the existing house price, crime and education caches, and adds small cached ONS pulls for earnings, healthy life expectancy and age profile.
- Routes `happiest-places.tsx` and `move-compare.tsx` with their own head() metadata. Links go in SiteHeader, UkTopicNav and the home page, plus sitemap entries.
- Tests: ONS-suppressed estimates are never ranked; anxiety ranks lower as better; a factor missing for one place is dropped for both; the household-type weights add up to 100%; the "unofficial" label is always part of the score output.
- AGENTS.md rule: the move-compare score is unofficial, derived only from published figures, never fed into register figures.
