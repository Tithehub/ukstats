# UKStats: every stat, every section, and the stream running order

## 1. Everything on the site, by section

**Main stat groups (UK register, shown on the home page and the stream)**
1. **Finance**: national debt (£), debt as a % of GDP, unemployment, GDP growth, government income, total welfare bill, foreign aid
2. **Cost of living (24 figures)**
   - Headline inflation: CPI, CPIH
   - Shopping: food, alcohol and tobacco, clothing, furniture, restaurants and hotels
   - Energy and fuel: electricity, gas, motor fuel, housing/water/fuel
   - Council tax: annual rate and price index
   - Phone and internet: communication, mobile, landline
   - Water and sewerage
   - Rents
   - Travel: all transport, rail, road, air
   - Wages: average weekly earnings
3. **Irregular immigration and cost**: small boat arrivals (latest day and year so far), detected illegal entries, asylum costs
4. **Immigration (legal)**: work visas granted
5. **Population**: UK resident population, net migration
6. **Crime**: police officers, street crime near Westminster, recorded crime
7. **NHS and doctors**: A&E within 4 hours, cancer 62-day target, ambulance Category 2 times, bed occupancy, waiting list, GPs, NHS vacancies, overseas-trained doctors
8. **Housing**: average house price
9. **Defence and security**: armed forces numbers, defence spending, terror threat level
10. **National alerts**: Met Office weather warnings, flood warnings, air pollution, UKHSA heat/cold health alerts
11. **Politics and polling**: registered parties, Westminster voting intention
12. **Weather**: current conditions

**Live feeds (updating now, not dated publications)**: emergency planes in the sky, world unrest warnings (UK FCDO and US State Dept), migration flows, news and police headlines, earthquakes, public road cameras

**Other pages**: Small Boats, Foreign Aid, Gold reserves, Tax vs Welfare, Spending (councils and 24 categories), Safest Places / City Crime, Happiest Places, Move Compare, Education (schools, universities), Regions, Maps, Countries and World rankings, Compare Countries, Polling, Parties, Politics Explained, Governments, Online Speech, Scandals, Grooming Gangs Inquiry, Preparedness, Daily PDF reports, Restore Britain, Citizen Journalists, Business Directory, Sponsors, Rent UKStats, Globe, Live. Horse racing stays hidden.

## 2. How the stream runs today (London clock)

- **Even hours** = UK hour. **Odd hours** = world hour: a different country every 5 minutes, rotating through the full list.
- **"About UKStats" break**: 40 seconds at :00, :15, :30 and :45.
- **Sponsor cards**: rotate continuously in the corner rather than in their own breaks.
- **Each card** stays up for 9 seconds.

Current UK hour (minutes):

```text
:00 Small boats headline ... 8
    Economy & finances ...... 7
    Cost of living .......... 7
    Small boats update ...... 5
    Crime ................... 7
    NHS ..................... 6
    Legal migration ......... 6
    Population .............. 3
    Housing ................. 3
    Defence & alerts ........ 5
    Politics & polls ........ 3
    Weather ................. 3
    Live flights ............ 2.5
    News headlines .......... 2.5
    Recap ................... 4   -> :60
```
Any topic with no published figure is dropped, and the remaining topics stretch to fill the hour.

## 3. Proposed new UK hour (for you to edit)

```text
:00 About UKStats (40s) -> Top story / headlines (2)
:02 Small boats headline (6)
:08 Debt & economy (6)
:14 Weather + national alerts (1)
:15 SPONSOR BREAK (60s) + About UKStats
:16 Cost of living (8)
:24 Crime (6)
:30 NEWS HEADLINES (3) + About UKStats
:33 NHS (6)
:39 Legal migration + population (5)
:44 SPONSOR BREAK (60s)
:45 About UKStats -> Housing (3)
:48 Defence & terror threat (3)
:51 Politics & polls (3)
:54 Live flights / world warnings (2)
:56 Recap: small boats + key figures (4)
```
- **Sponsor breaks**: twice an hour, 60 seconds each, every sponsor shown full screen in turn with its QR code. They are in addition to the corner card.
- **Headlines**: a fixed slot at the top and half past the hour.
- **World hours**: keep the 5 minutes per country, with a sponsor break at :15 and :45.

## Technical details
- Reorder `UK_HOUR` in `src/lib/stream-schedule.ts` and add `sponsor`/`news` slot kinds. The new breaks use the same clock rule as `promoAt`, so a reload lands on the same moment.
- No new figures are added. Only the order and timing change. Classic and rented streams stay as they are unless you say otherwise.
- Update the schedule tests to check the new start times.
