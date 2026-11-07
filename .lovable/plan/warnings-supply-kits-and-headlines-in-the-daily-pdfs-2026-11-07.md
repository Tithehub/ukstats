# Warnings, supply kits and headlines in the daily PDFs

## What gets added

**UK report and Global report (both)**
- **UK Government warnings** page: current UK threat level, Met Office weather warnings, flood warnings and UKHSA health alerts. Each one shows the publisher, the date it was issued and a link to the official source. If a feed didn't answer, the report says "Not published at time of report" instead of guessing.
- **Emergency supply kits** box: the official GOV.UK "Prepare" guidance link, then the same direct supplier links the Preparedness page already uses. It includes the existing notice that UKStats makes no money from these links and doesn't endorse or test any product. Every link can be clicked in the PDF.
- **Main headlines**: up to 5 of the day's UK headlines, word for word, each labelled "News" or "Police notice" with the publisher and time. They sit in their own section, clearly separate from the official figures. If there are none, the section is left out.

**Global report only**
- **Government travel warnings, all countries**: a table covering every country, showing the UK FCDO advice level and the US State Department level side by side. Each government keeps its own wording and they are never merged. Countries that haven't been checked show "Not checked". Countries that have an official riot or protest mention in the last 30 days get a marker. The table is sorted by severity (most serious first), then by country name.
- **Main headlines per country**: up to 3 headlines for each country that has them, also word for word with labels. Countries with no headlines are skipped.

## Rules kept
- The reports only use data that's already been saved: the UK stats, the world rankings, the government warnings and the headlines. Making a report never waits on outside publishers.
- No figures are made up. Headlines and warnings only add context; they never create a figure.
- The report pages on the site are updated to list the new sections.

## Technical details
- `reports.server.ts`: also read payload_cache `unrest-v1` and `news-reports-v1` and pass them to the PDF builder.
- `report-pdf.ts`: add `warnings`, `fcdoAlerts`, `headlines` inputs; new section renderers with page-break handling and link annotations; supplier list comes from `PREPAREDNESS_SUPPLIERS` + `SUPPLIER_LINK_POLICY`.
- Pure helpers for "sort countries by severity" and "pick headlines per country", with tests in `reports.test.ts` (sort order, a missing country shows "Not checked", headline limit per country, all of a region's warnings are left out if that region's feed is incomplete).
- Regenerate today's UK and Global editions after the change and open the PDFs to check the layout.
