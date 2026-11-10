# Founding documents: dropdown history for each card

## What you'll see
- Each of the four founding-document cards on the home page gets a "Read the history" dropdown under it (closed by default, so the home page stays tidy).
- Opening it shows a short explainer arranged **earliest to latest**, for example for Magna Carta: 1215 sealing, 1216/1217/1225 reissues, 1297 confirmation in statute, 1829–1969 repeals, the 3 clauses still in force today.
- Bill of Rights 1689, Claim of Right 1689 and Act of Settlement 1701 get the same treatment: why it was passed, what it did, major later amendments or repeals (e.g. Succession to the Crown Act 2013 changes to the Act of Settlement; Parliamentary Privilege cases on Article 9), and what is still in force.
- Every dated entry links to its official source (legislation.gov.uk, Parliament, National Archives, UK Supreme Court judgments).
- A line at the top of each dropdown: "Plain-English history · not legal advice · sources linked".
- A link at the bottom: "Read the full explainer" to a new page `/founding-documents` containing all four histories in full, one after another, earliest document first (Magna Carta 1297 → Bill of Rights / Claim of Right 1689 → Act of Settlement 1701). The page is linked from the home card and the menu.

## Rules followed
- No change is described as "illegal" or "unlawful" unless a court ruling or official source says so, quoted and linked. Where none exists, the entry just says what changed and by which Act.
- Every date and Act name is checked against legislation.gov.uk before it goes in; anything I can't confirm is left out rather than guessed.

## Technical details
- New `src/lib/founding-documents.data.ts`: per document, ordered `timeline: { year, title, text, sourceHref, sourceLabel }[]`, checked date stamp.
- `FoundingDocuments.tsx` uses a native `<details>/<summary>` dropdown per card (accessible, no extra JS); cards keep current shape and thumbnails.
- New route `src/routes/founding-documents.tsx` with its own head() metadata; add to menu, page search and sitemap.
- Nothing published.
