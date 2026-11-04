# Grooming gangs inquiry section

A new, large page at **/grooming-gangs-inquiry** covering the UK's grooming gangs ("rape gangs") inquiries, built only from official published documents — every fact quoted or summarised with its source, publication date and link. No estimates, no figures we can't point to.

## What the page contains

1. **Where things stand now** — the current national inquiry: when it was announced, who chairs it, its terms of reference, status, and expected report dates (marked "not yet published" until they exist).
2. **Timeline** — dated official milestones: Rotherham (Jay 2014), Rochdale, Telford (Crowther 2022), Oxfordshire, IICSA final report (2022), Baroness Casey's national audit (June 2025), the government's response and the national inquiry launch, plus later official updates.
3. **Key official findings** — short verbatim quotes from each report with page/paragraph references and links (e.g. the Jay report's estimated victim count, quoted as the report's own estimate, clearly attributed).
4. **Published figures** — only numbers official bodies have published (Casey audit data, Home Office / NCA Operation Hydrant and police group-based CSE figures, convictions announced by the CPS). Each shows source, period, date published and next release. Where no data exists: "Not published".
5. **Local inquiries tracker** — table of areas with a local review or inquiry, its status and the official link.
6. **Recommendations tracker** — each recommendation from Casey/IICSA with the government's stated position (accepted / in progress / not stated), sourced to government statements.
7. **Support for survivors** — NSPCC, Rape Crisis, NAPAC, Victim Support, Police 101/999, prominently at the top and bottom.
8. **Sources** — full list of documents with dates checked.

Content is written soberly: no victim names, no naming of individuals beyond what court judgments and official reports publish, nothing that could prejudice live trials.

## Where it appears
- New menu item "Grooming gangs inquiry" in the UK topic navigation and site header menu.
- A card on the UK home page linking to it.
- Added to the sitemap with its own title and description.

## Technical details
- Dated snapshot file `src/lib/grooming-inquiry.data.ts` (every entry: source URL, publisher, published date, checked date, verbatim quote); links verified before adding, as with the preparedness and agencies directories.
- Pure helpers in `src/lib/grooming-inquiry.ts` (timeline sorting, status, recommendation counts) with tests.
- Route `src/routes/grooming-gangs-inquiry.tsx` using existing card/source components and fmtDate.
- Research done by a researcher agent against gov.uk, IICSA archive, council and police sites; anything unverifiable is left out.
- AGENTS.md rule added; preview only until you say "publish".
