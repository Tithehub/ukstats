# Two book/inquiry buttons on the home page

## What you'll see
A clear band near the top of the home page (just under the red LIVE bar and headline figures) with two side-by-side cards, stacked on phones:

1. **The Rape Gang Inquiry — Rupert Lowe MP and Restore Britain**
   - Button: "Visit the inquiry" → therapeganginquiry.org
   - Second link: Restore Britain announcement

2. **The Grooming Gang Cover-Up — Tommy Robinson and Peter McLoughlin**
   - Book cover thumbnail (the publisher's own cover image, downloaded and stored with the site)
   - Button: "Buy on Amazon UK" → amazon.co.uk/dp/0995584982
   - Button: "Book website" → groominggang.com

Both cards are labelled "Independent — not an official source", and a small line links to the full Grooming Gangs Inquiry page. No figures are taken from either.

## "Number one seller"
I'll only show "No.1 bestseller" if Amazon's own page shows that badge when I check it; otherwise the card says "Book, November 2026" without the claim.

## Technical details
- New `IndependentWorksCta` component reading `INDEPENDENT_WORKS` from grooming-inquiry.data.ts (add optional `coverImage` field); placed in src/routes/index.tsx home layout.
- Cover fetched from the book website/Amazon, stored as a project asset; links open in a new tab with `rel="noopener noreferrer"`.
- Semantic theme tokens only (navy/red/yellow).
