# Refined stream running order (proposal only, no site changes)

## Rules for the whole loop
- Only published figures, dated official warnings and credited headlines go on air. A topic with no figure that day is skipped.
- Every card shows its source, date and next release.
- Scandals, the Grooming Gangs Inquiry and press stories are **context segments**. They are labelled "Background, not official statistics" and never show a number of their own.
- Small boats comes up three times an hour: lead, update and recap.
- Breaks happen at fixed times on the London clock, so a reload always lands in the same place.

## Every segment available to the stream
| Group | What it shows | Source type |
|---|---|---|
| Top story | Credited lead story (currently the FT) and the latest headlines | Press, labelled |
| Small boats | Latest day, year so far, comparison with last year | Home Office |
| Illegal entry and asylum cost | Detected arrivals, asylum spending | Home Office |
| Debt and economy | National debt, debt as % of GDP, GDP growth, unemployment, government income | ONS / OBR |
| Tax vs welfare | Welfare bill compared with tax receipts | ONS / DWP |
| Foreign aid (new) | Aid spending, aid as % of national income, top recipients | FCDO / OECD |
| Gold reserves (new) | UK gold holdings and world ranking | IMF |
| Cost of living | Inflation, food, energy, fuel, council tax, rent, travel, wages | ONS |
| Council spending (new) | Highlights from the 24 spending categories (one council area per hour) | Council returns |
| Crime | Police numbers, recorded crime | Home Office / police.uk |
| Safest and least safe places (new) | Top 3 lowest and highest crime towns and cities | Police data |
| NHS | A&E, cancer, ambulance, waiting list, GPs, vacancies | NHS England |
| Legal migration and population | Work visas, net migration, population | Home Office / ONS |
| Housing | House prices, rents | ONS / Land Registry |
| Education (new) | School and university headline figures | DfE |
| Happiest and saddest places (new) | Top 3 happiest and saddest areas by wellbeing score | ONS wellbeing |
| Defence and security | Terror threat level, armed forces, defence spending | JTAC / MoD |
| National alerts | Weather, flood, air quality and health alerts | Met Office / EA / UKHSA |
| Politics | Polls, registered parties | Pollsters / Electoral Commission |
| Online speech (new) | Official arrest and prosecution figures | Published official data |
| Grooming Gangs Inquiry (new, context) | Inquiry status, dates and the "Not published" national counts | Official snapshot |
| Scandals (new, context) | One featured scandal per hour, with its dated timeline | Sourced timeline |
| Live flights / world warnings | Emergency squawks, FCDO and US advice | Live feeds |
| Weather now | Current conditions | Met Office |

## Refined UK hour (even London hours)
```text
:00:00  About UKStats (40s)
:00:40  Top story & headlines .............. 2
:03     Small boats lead .................... 5
:08     Debt & economy ...................... 4
:12     Tax vs welfare + foreign aid ........ 3
:15:00  About UKStats (40s)
:15:40  SPONSOR BREAK (60s)
:16:40  Cost of living ...................... 6
:23     Council spending spotlight .......... 2
:25     Crime + safest/least safe places .... 5
:30:00  About UKStats (40s)
:30:40  HEADLINES (half past) ............... 2
:33     Small boats update .................. 3
:36     NHS ................................. 5
:41     Legal migration & population ........ 3
:44     Housing + gold reserves ............. 1
:45:00  About UKStats (40s)
:45:40  SPONSOR BREAK (60s)
:46:40  Education / happiest places (alternating hours) .. 2
:49     Defence, terror threat & national alerts ......... 3
:52     Context: Grooming Inquiry or a scandal (alternating) .. 2
:54     Politics & polls / online speech (alternating) .... 2
:56     Weather + live flights / world warnings ......... 1
:57     Recap: small boats + the hour's key figures ...... 3
```

## Refined world hour (odd London hours)
```text
:00     About UKStats, then world headlines (2)
:02-:15 Countries, 5 min each: debt, inflation, unemployment, migration, travel advice
:15:40  SPONSOR BREAK (60s)
:16-:30 Countries continue
:30:40  World rankings spotlight (2): one World Bank ranking, e.g. debt or GDP
:33-:45 Countries continue
:45:40  SPONSOR BREAK (60s)
:46-:55 Countries continue
:55     World warnings + migration flows round-up (3)
:58     "UK hour next" teaser with small boats (2)
```

## Break formats
- **About UKStats (40s)**: the site, a QR code and the free-stats message.
- **Sponsor break (60s)**: full screen, each sponsor in turn with name, picture and QR code, split equally. If there are no sponsors, this time goes back to the figures.
- **Headlines (2 min)**: the credited lead story first, then official notices, then other news. The publisher and time are shown on each.
- **Corner card**: sponsors and the recommended inquiry and book keep rotating outside the breaks.

## Alternating slots (so the hour feels fresh)
- Education or happiest places, Inquiry or scandal, and politics or online speech each swap every UK hour.
- The council spending spotlight goes through the categories one hour at a time.
- The featured scandal goes through the list in order.

## Open questions for you
- Should scandals and the Inquiry be on air at all, or only on the website?
- Would you like 2 sponsor breaks an hour, or 4 shorter ones of 30 seconds?
- Which spending categories and scandals should go first?

## Technical notes (for when you approve building it)
- The pages for foreign aid, gold, safest places, happiest places, education, online speech, spending, the Inquiry and scandals already have their data. Bringing them onto the stream means adding them as new segments that reuse that data, with no new figures.
- Alternating slots would be picked from the hour count, so a reload stays in the same place.
