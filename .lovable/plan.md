# Why Scotland is missing from the map — and how to fix it

## What's actually happening

Nothing is broken; the map is only ever loading England-and-Wales boundaries and England-only data.

- The crime choropleth draws the ONS/Home Office **Police Force Areas (Dec 2024, EW)** boundary file — England and Wales only. Scotland and Northern Ireland have no shapes to colour, so they stay blank.
- The crime figures come from the ONS "Table P3" police-force-area workbook, which also covers England and Wales only. Police Scotland records crime under the Scottish Crime Recording Standard and publishes separately, so it is not in that table.
- The house-price choropleth draws the **Regions (Dec 2025, England)** boundary file and requests only the nine English regions from the UK HPI API.
- The postcode pin layer uses Police.uk street-level crime, which does not carry Police Scotland data at all.

## What to change

### 1. UK-wide country boundaries
Add an ONS "Countries (UK, BUC)" boundary layer so England, Scotland, Wales and Northern Ireland all render, and widen the map's default view to fit the whole UK rather than England.

### 2. House prices: cover the whole UK
UK HPI already publishes Scotland, Wales and Northern Ireland. Request those alongside the nine English regions and draw the house-price layer on a combined regions + countries boundary set, so Scotland is shaded with its own published average price and links to the same Land Registry / Registers of Scotland source.

### 3. Crime: add Scotland from its own official publisher
Add a Scotland crime layer built from Scottish Government / Police Scotland "Recorded crime in Scotland" official data, shown at Scotland-country level (and by the 13 Police Scotland divisions if a machine-readable feed exists). This is a separate recording standard from England and Wales, so the layer will be labelled as such and never merged into an England-and-Wales rate for comparison.

First step is a verification pass on the available feeds; if no machine-readable Scottish feed is published, Scotland gets an explicit "No live feed — see Police Scotland quarterly release" state with the real source link, never an estimated figure.

Northern Ireland (PSNI recorded crime) gets the same treatment in the same pass.

### 4. Honest coverage labelling
Every layer states its geographic coverage in the legend ("England and Wales only", "United Kingdom", "Scotland — Scottish Crime Recording Standard"), and areas with no published figure render as a neutral "not published by this source" shade with a tooltip explaining why — no blank-looking gaps.

The postcode pin search keeps its existing behaviour but will say plainly that Police.uk street-level data does not include Scotland, pointing to Police Scotland instead.

## Technical notes

- New ONS ArcGIS boundary URL for UK countries; combine with the existing regions file for the house-price layer.
- `HPI_REGIONS` in `src/lib/uk-stats.functions.ts` gains `scotland`, `wales`, `northern-ireland` slugs (codes S92000003, W92000004, N92000002).
- `MapLayer` gains a `coverage` field so `StatsMap.tsx` can pick the right boundary set and render the legend note.
- New Scotland/NI crime collectors follow the existing cached + retrying pattern, with explicit unavailable states.
- Dark and light themes, sharing and source links stay exactly as they are.
