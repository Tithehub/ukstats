# Terms & Conditions page, footer link and branded PDF

## What you'll see
- A new "Terms & Conditions" link in the footer on every page (UK and stats.solutions).
- A new `/terms` page with the full terms, laid out to be easy to read, with a "Download PDF" button.
- A UK Stats branded PDF of the same terms: navy cover with the all-white UKStats logo, "Terms & Conditions", version and effective date, then numbered sections, page numbers and the logo in the header. It is a printed copy of the page text, so the two always match.

## What the terms cover (written to protect UKStats as far as English law allows)
1. Who we are and how to contact us; acceptance by using the site.
2. Information only: statistics come from official publishers, shown "as published"; not financial, legal, investment, travel, safety, medical or betting advice.
3. No warranty on accuracy, completeness, timeliness or availability; publisher errors are theirs; figures can be revised.
4. Limitation of liability: no liability for indirect or consequential loss, lost profit or decisions made on the data; total liability capped at what the user paid us in the last 12 months (or £100). Nothing excludes liability for death/injury by negligence, fraud, or anything the law won't allow.
5. Third-party content and links: GOV.UK, ONS, IMF, World Bank, YouTube, news headlines, sponsors and businesses in the directory are not endorsed or controlled by us.
6. Sponsors and adverts: sponsorship never influences figures; banned categories; we may refuse or remove any sponsor.
7. Paid digital products (daily PDF reports, Rent UKStats): digital content, prices in GBP, renewals and cancelling, and consumer rights — including the 14-day cancellation right being lost once a download starts with your consent.
8. Accounts, citizen journalists and user submissions: user responsibility, licence to us to display, our right to remove, moderation.
9. Acceptable use: no scraping beyond the open API limits, no abuse, no reverse engineering, no misuse of the AI presenter or stream.
10. AI features: AI presenter and agent drafts are labelled; may contain errors; not a source of figures.
11. Intellectual property: our design, logo and text; official data under its own licences (e.g. Open Government Licence).
12. Indemnity by users who misuse the site or submit unlawful content.
13. Suspension, changes to the site and to these terms; severability; no waiver; entire agreement.
14. Governing law: England and Wales, courts of England and Wales (consumers keep their local rights in Scotland/Northern Ireland).

## Needs your details (I'll leave clearly marked gaps if not supplied)
- Legal name of the operator (person or company), company number if any, and a contact email/postal address.

## Important
I'll write strong, standard UK-style terms, but I'm not a lawyer — have a UK solicitor check them before relying on them. Nothing is published until you say so.

## Technical details
- Terms text in one shared module (`src/lib/terms.data.ts`) with version + effective date, used by both the route and the PDF.
- Route `src/routes/terms.tsx` with its own head() metadata; footer link added to `SiteFooter.tsx` (new "Legal" link row).
- PDF generated with ReportLab using the existing report cover styling/logo, saved to `public/legal/ukstats-terms.pdf`; visual QA of every page.
- Also listed in the sitemap.
