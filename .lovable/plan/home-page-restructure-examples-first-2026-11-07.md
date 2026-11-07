# Home page restructure: examples first

The goal is to put the free UK figures back at the centre of the home page, with paid services as a clear secondary option. Nothing gets removed: the globe, live stream, countries, spending, the inquiry page, preparedness, sponsors and Rent UKStats all stay, just lower down or one tap away.

## What I'll make (pictures only, no site changes)
Three home page layouts drawn with today's real figures. Each comes as a desktop picture and a phone picture.

**A. "The UK right now" dashboard first**
1. A short headline with a search box.
2. Six big cards: public sector debt, small boats (latest day and year to date), terrorism threat level, Met Office weather warnings, inflation and crime. Each card shows its source, date, age and next update.
3. Topic strip: cost of living, immigration, crime, finance, spending, housing.
4. "Latest official releases" and "Coming up this week".
5. The live stream and globe.
6. Countries and world rankings.
7. A slim band: "Free forever. Need it branded, embedded or on your screen? See our paid services."

**B. Alert-led**
A red/amber/green "Alerts" bar first: terror threat level, weather warnings and the latest small-boat day. Then the debt clock and key figures, topic hubs, the stream and globe, and the paid services band.

**C. Story flow**
Sections ordered like a front page: Money (debt, inflation), Borders (small boats, migration), Safety (terror level, crime), Weather and warnings, then the World. The live stream sits on the right as a sticky column on desktop, and paid services come near the end.

Every version keeps:
- A "Free forever — no account needed" promise near the top.
- One calm "See our paid services and products" link (Rent UKStats, sponsorship, the stream), never in the way of the figures.
- "Not published" wherever a figure isn't available. No numbers are invented.

## After you pick
I'll write a separate build plan for the chosen layout (or a mix) for you to approve before anything on the site changes.

## Technical details
- Static HTML mockups drawn with real current values from the existing loaders and payload cache, captured with Playwright at 1440 and 375 widths, saved to /mnt/documents/home-layouts/.
- The terror threat level and Met Office warnings will only appear if the site already pulls them. Otherwise the card shows "No live feed" with the official link.
