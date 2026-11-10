# UKStats Explainer — hourly presenter segment + polished MP4

## What it is
A 2–3 minute "About UKStats" explainer, presented by the same brunette Orbit presenter and voice. It comes in two forms:
1. **Live segment** in the Orbit stream, airing at a fixed minute every hour (proposed :30 to :33). Its figures and globe are live.
2. **Polished MP4** of the same segment, for YouTube, X and the website. Saved to Files only.

The old classic stream, the portrait stream and rented streams stay unchanged. Nothing is published until you approve it.

## Running order (about 2:45)
| # | Chapter | Length | What's on screen | What the presenter says (gist) |
|---|---|---|---|---|
| 1 | Welcome | 0:15 | UKStats logo (squared bars), ukstats.co.uk, QR | One source of truth for UK and world official statistics, always free |
| 2 | Interactive globe | 0:40 | The real 3D globe zooming on the UK, then 2–3 countries; travel-advice, flights, migration and news layers switched on one at a time | How to explore countries, warnings and flights, with every layer labelled by its publisher |
| 3 | Where our stats come from | 0:30 | Publisher tiles (ONS, Home Office, HM Treasury/OBR, Met Office, UKHSA, Eurostat, World Bank, IMF); a figure card showing its source, period and next release | Every figure shows source, date and next release. Nothing is invented; a missing figure says "Not published" |
| 4 | Daily PDF reports | 0:30 | Real UK and Global report covers, pages flipping, QR to /reports | UK £1/day, Global £2.50/day; monthly £19.99 / £49.99; yearly £199 / £499; includes warnings, headlines and supply-kit guidance |
| 5 | Rent and brand your own stats site | 0:30 | Real /rent screenshots: white-label widgets, dashboards, stream layouts, AI or self presenter, country bundles; QR to /rent | Put your own brand on our stats and stream. Prices are as listed on /rent, read from the live price list |
| 6 | Coming soon: sports | 0:15 | New UKStats-branded multi-sport image (racing, football, rugby, golf, F1, darts, boxing) | "Sports stats and free games, coming soon." No racing details, no link, no odds |
| 7 | Close | 0:10 | Logo, ukstats.co.uk, @ukstatsglobal, QR | Follow and share; back to the stats |

## New asset needed
- One high-quality multi-sport image in the navy/red Orbit style, with the UKStats three-bar mark (squared bars). 1920×1080 for the stream, plus a 1200×900 crop for the card.

## Rules kept
- Only real published figures appear. Prices come only from the site's existing price settings, never typed into the script.
- Racing stays hidden: the sports chapter is a teaser image and line only.
- On-screen chapter labels make clear it is "About UKStats", not news or statistics.
- The hourly slot replaces the stream item at that minute. The two sponsor breaks per hour stay.

## How the MP4 gets made
Record the live segment from the preview at 1920×1080 with the presenter's voice. Before delivery, check every chapter frame by frame: no blank tiles, clipped text, counters caught mid-count, or wrong labels. If the recording isn't clean enough, the fallback is the motion-graphics video maker using the same screenshots and assets. You'll get a draft to review before anything is final.

## Technical details
- New `explainer` segment type in `stream-schedule.ts`, at a fixed London-clock minute, rendered by a new `OrbitExplainer` inside `BroadcastView.tsx`. It reuses GlobeExplorer focus/layer toggles, the existing report-cover art, rent screenshots and QR helpers.
- Presenter lines come from `scriptForCard`-style chapter scripts, and chapter timing follows the speech. Prices are pulled from the existing pdf-report and rent price modules.
- Preview with `/globe/broadcast?segment=explainer` so it can be checked without waiting for the slot.
- Tests: the slot fires at the chosen minute every hour, and sponsor-break timing is unchanged.

## Open points for you
- Is :30 to :33 the right minute?
- Any wording or chapter order you want changed before we start?
