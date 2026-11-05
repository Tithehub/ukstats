# Grooming gangs page: add the book and the Rape Gang Inquiry links

Neither link is on the site yet. Both go on the Grooming gangs inquiry page, in a new box called **"Other investigations and books"**. It sits below the official sources, and the label makes clear these are not official government sources.

## Links to add
1. **The Grooming Gang Cover-Up** by Tommy Robinson and Peter McLoughlin (published November 2026). The link goes to the book's own website, groominggang.com. We'll also show a plain Amazon UK link with no affiliate code.
2. **The Rape Gang Inquiry**, the independent inquiry set up by Rupert Lowe MP and paid for by public donations. The link goes to its own website, therapeganginquiry.org, plus the Restore Britain announcement on Substack.

## Wording on the page
- "These are independent publications, not official sources. UKStats makes no money from these links and does not take figures from them."
- None of the figures in these publications will be added to the site's statistics. The site's figures still come only from official publishers.

## Where the links show up
- The new box on /grooming-gangs-inquiry.
- A short "Independent inquiry and book" line near the top of that page, linking down to the box. The page is already in the menu and the topic bar.

## Technical
- Add `INDEPENDENT_WORKS` (title, author, kind, url, checked date) to grooming-inquiry.data.ts, and render it in grooming-gangs-inquiry.tsx with `rel="noopener noreferrer nofollow"`.
- Before adding each link, check that it opens (HTTP 200).
