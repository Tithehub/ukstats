# FT story: home page feature + presenter mention in the UK hour

## What the article is
Financial Times, "Far-right British MP outperforms most world leaders on X" — standfirst: "Rupert Lowe's 1.7bn views underscore the power of the platform's owner Elon Musk to amplify voices from political fringes." Paywalled; only the headline and standfirst are readable.

## Home page (ukstats.co.uk)
- New "Main story" card near the top of the UK home page, above the UK Live stream section.
- Shows the FT headline and standfirst **word for word in quotation marks**, with "Source: Financial Times" credit, the publication date, and a "Read on FT.com" button to the article.
- Labelled "In the news — press coverage, not an official statistic". The 1.7bn views is shown only as the FT's own words, never as a UKStats figure.
- No FT photo (it's FT/EPA copyright). Uses navy brand styling with a red "Main story" tag and the FT name as text.
- Links on to the Restore Britain page.

## Presenter (Orbit stream, UK hour only)
- One extra "In the news" card in the even-hour UK running order, after the headlines block.
- Presenter line, e.g.: "In the news: the Financial Times reports that Rupert Lowe has outperformed most world leaders on X, with what it says are 1.7 billion views. Read the full report at ft.com." Panel shows headline, "Financial Times" credit, date and a QR to the article.
- Not shown in rented streams, embeds, PDFs or share images; odd (world) hours unchanged.

## Technical
- One dated snapshot `src/lib/featured-story.data.ts` (headline, standfirst, publisher, URL, date, `streamUk: true`) feeding both the home card component and `buildRundown` / `scriptForCard`.
- Add a test that the card appears only in UK segments and the script credits the Financial Times.
- AGENTS.md rule: featured press stories are verbatim, credited snapshots, separate from statistics.
- Not published until you say so.

## Check with you
The FT headline uses the term "far-right". Quoting it word for word is the honest way to credit them; I'll keep it exact unless you'd rather show only the standfirst.
