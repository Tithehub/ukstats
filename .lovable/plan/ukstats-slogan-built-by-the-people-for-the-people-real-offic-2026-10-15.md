# UKStats slogan: "Built by the people, for the people — real official facts only"

## What changes

Marco chose the slogan. It becomes the site's single official tagline and replaces the current hero line, appearing in three places:

1. **Home page hero** (src/routes/index.tsx)
   - The current tagline under the "UKStats" heading — "The numbers. The source. The full picture." — is replaced by the slogan: "Built by the people, for the people — real official facts only".
   - The descriptive line below it ("Debt, prices, crime, migration and more…") stays as-is.

2. **Home page sharing/search metadata** (head section of src/routes/index.tsx)
   - Page title becomes "UKStats — Built by the people, for the people".
   - The description and og:description start with the slogan, then keep the existing "every figure timestamped" wording, so shares on Bluesky/Mastodon/X show it.

3. **Restore Britain dedication footer** (src/components/layout/RestoreDedication.tsx)
   - The slogan appears as a short line in the dedication block, tying it to "built on behalf of the people, free of charge".

## Where the slogan lives in code

- The text is defined once in a small shared constant (src/lib/brand.ts: `SLOGAN`) so the hero, metadata and dedication can never drift apart.
- No database, payment, or statistics changes. Sponsor placement rules, funding pause and legal hold are untouched.

## Verification

- Typecheck and the existing test suite pass.
- Browser check: hero shows the slogan, the page source shows it in title/description, and the footer dedication shows the line.
- Not published — goes live on ukstats.co.uk when Marco says "publish".
