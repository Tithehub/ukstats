## Education section for UKStats

The site has no education figures yet. This adds a new Education area. It follows the same rules as the rest of the site: only official published figures, each showing its source, period, age and next release date. Where a nation or institution has no published figure, it says "Not published" and never estimates one.

### What visitors get

1. **/education**: the national overview
   - Headline figures for each UK nation: number of schools, pupils, teachers, pupil–teacher ratio, absence rate, exclusions, exam results (KS2, GCSE/Attainment 8, A level), university student numbers. Each nation is shown separately and never added together, because each nation measures these differently.
   - Ofsted results across England (share of schools Outstanding, Good, Requires improvement, Inadequate), labelled with the date of the inspection data.
   - Year-on-year changes using the existing comparison style.
2. **/education/schools**: a searchable finder covering every open school and college in England (about 25,000 schools plus colleges), searched by name, town or postcode, with filters for phase, type, Ofsted grade and local authority. Search and filters are kept in the page address so results can be shared.
3. **/education/schools/[id]**: a page for each school showing:
   - basic details: type, age range, pupil numbers, capacity, free school meals percentage, religious character and trust
   - latest Ofsted date and judgements, linked to the report
   - published performance (KS2, Progress 8 / Attainment 8, A level) where the government publishes it, or "Not published" where figures are suppressed
4. **/education/universities**: every UK provider registered with the Office for Students, with Teaching Excellence Framework (TEF) ratings, student numbers, continuation and completion rates, and graduate outcomes from official data. National Student Survey satisfaction is included but clearly labelled as a survey.
5. **Scotland, Wales and Northern Ireland**: their own official school lists and headline statistics, shown separately. Any measure a nation does not publish is marked "Not published".
6. **Links into the section**: an Education entry in the menu and topic bar, a card on the home page, social preview cards, entries in the sitemap, and Education as a topic in the downloadable reports (UK edition).

### Official sources (each one checked before use)
- England: Get Information about Schools (the full school register), Explore Education Statistics (pupils, workforce, absence, exclusions, attainment), school performance tables downloads, and Ofsted's latest inspection results.
- Higher education: OfS Register and TEF outcomes, HESA open data, OfS student outcomes, National Student Survey.
- Scotland: Scottish Government school contacts and statistics; Wales: StatsWales and the My Local School source data; Northern Ireland: Department of Education NI school-level data.

### Build order
1. Check every source link and file format. Drop any source that won't download automatically and mark it "No live feed" with a link to the publisher.
2. Set up storage and the nightly refresh for schools and universities.
3. Build the national overview page.
4. Build the school finder and school pages.
5. Build the universities pages.
6. Add the devolved nations.
7. Add the menu, home page and report links, plus social previews.
8. Test the data readers and the "Not published" rules, then check the pages in a browser on desktop and phone.

### Technical details
- New table `education_institutions`, keyed by URN, UKPRN or national ID, plus `education_metrics`, which records the source, period and published date for each figure. Both are public-read only under row-level security and written only by a server-side refresh.
- A refresh route under /api/public/education-tick runs nightly via the existing cron setup. It checks a secret before doing anything, and the large CSVs are downloaded in streamed batches to stay within edge limits.
- Pure readers go in src/lib/education.ts with tests, and network code in src/lib/education.server.ts. Server functions use POST, and pages use the shared query options plus PageFeedback.
- Suppressed values (for example "SUPP", "NE" or "x") are stored as not published, never as zero. Ofsted grades are kept exactly as published, including the post-2024 change away from single-word judgements.
