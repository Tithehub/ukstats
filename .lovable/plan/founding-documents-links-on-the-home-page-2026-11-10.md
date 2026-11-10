# Founding documents links on the home page

Add a small, clearly labelled "Our founding documents" card to the UK home page, linking only to the official government text on legislation.gov.uk (The National Archives).

## Note on wording
England has no single written "English Constitution". The card will say this plainly and link to the official texts that make up its core:
- Bill of Rights 1689 — legislation.gov.uk/aep/WaM/1/2
- Magna Carta (1297) — legislation.gov.uk/aep/Edw1cc1929/25/9
- Claim of Right 1689 (Scotland's equivalent) — legislation.gov.uk/aosp/1689/28
- Act of Settlement 1701 — legislation.gov.uk/aep/Will3/12-13/2

Each link is checked to open before adding. Labelled "Official legal text, not statistics".

## Where
On the UK home page, near the inquiry/book cards, before the footer. Opens in a new tab. Works on phone, tablet and desktop.

## Technical
- New `FoundingDocuments` component in `src/components/home/`, rendered in `UkLanding`.
- Design tokens only; no new data fetching.
- Not published until you say.
