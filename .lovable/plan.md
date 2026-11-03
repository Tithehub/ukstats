# Official preparedness advice page

## What you'll get
A new page, "Be prepared — official government advice", at /preparedness. It starts with the UK and then lists every country that publishes official household preparedness guidance.

- **UK first:** the government's "Prepare" advice, quoted word for word (for example, keeping water, food and essentials at home for emergencies), with a link to the official gov.uk source and the date we last checked it.
- **Other countries:** one card per government that publishes guidance. Likely examples are the EU (72-hour advice), Sweden, Finland, Norway, Denmark, Germany, the Netherlands, the US (Ready.gov), Canada, Australia, New Zealand and Japan. Each card shows:
  - the publishing body
  - the exact recommendation (how many days, and how much water per person if they state it)
  - a link to the official page
  - the date the advice was published, or "date not stated"
  - the date we last checked it
- **Wording rule:** we only quote the advice as each government phrases it. The page never says "stockpile" or "warning" unless the source does, and adds nothing of our own.
- **Search and filter** by country or region, plus a link in the site menu and topic navigation.
- **No buy link for now.** A note says supplier links will come later, once the legal hold lifts.

## Rules
- We only include a country after opening its official page and confirming both the advice and the link. Countries we can't verify are left off, never guessed.
- A footer line makes clear these are official recommendations, not statistics, and that UKStats is independent.

## Technical details
- A dated snapshot in `src/lib/preparedness.data.ts` (checked date, source URL, publisher, quote, days, water litres or null, published date or null), read through `src/lib/preparedness.ts` with a pure filter.
- A test checking that every entry uses an official government domain over https, that no quote is empty, and that missing dates stay null.
- The route `src/routes/preparedness.tsx` with its own head(), URL search parameters for the search and region filter, and PageFeedback.
- Entries added to the sitemap and SiteHeader, and a rule recorded in AGENTS.md.
- Checked in a browser on desktop and phone. Preview only until you ask to publish.
