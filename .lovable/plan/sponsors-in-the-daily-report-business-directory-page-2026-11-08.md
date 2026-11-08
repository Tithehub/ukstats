# Sponsors in the daily report + Business Directory page

## 1. Sponsors back page in the PDF
- Add a new last page called "Thank you to our sponsors" to both the UK and Global daily reports.
- It lists every current sponsor (approved, switched on, paid, within their dates), with name, website, short description and the countries they sponsor in. Each website is clickable.
- A short note: "Sponsors keep UKStats free. They never see or influence any figure."
- The page sits after Sources, away from the figures. The cover and inside pages stay the same. If there are no sponsors, the page isn't added.
- Newly approved sponsors appear automatically in the next day's report.

## 2. New Business Directory page (/business-directory)
- A page listing every sponsored business: name, logo or banner picture, description, website button and regions.
- It includes a search box and a region filter, and both are kept in the page address so results can be shared.
- It's made up of current sponsors and fills in automatically as you approve new ones. Nobody appears without your approval.
- A "Get your business listed" button links to the sponsor sign-up.
- The page is linked from the main menu, the footer and the Sponsors page, and it has its own page title and description for Google.

## Technical details
- Shared helper `listDirectorySponsors(env)` in a new `src/lib/directory.functions.ts` (POST server fn). It reuses `visibleSponsors` and signed banner links the same way as `getSponsorBannerBoard`, and returns only public fields (name, url, tagline, regions, banner link).
- Route `src/routes/business-directory.tsx`: loader uses `ensureQueryData` and the component uses `useSuspenseQuery`. Search params `q` and `region` are validated with zod. PageFeedback handles the empty and error states.
- PDF: add an optional `sponsors` field to `ReportInput`. `reports.server.ts` loads visible live sponsors the same way. Add a `drawSponsorsPage` in `report-pdf.ts` with the new white-logo header, wrapped rows and link annotations. The page is added to the contents line on the cover.
- Add a pure helper and a test that only approved, active, paid and in-date sponsors are included. Run the existing report tests.
- Update the sponsor AGENTS.md rule to list the directory and the report back page as approved sponsor placements, still never on figure cards, embeds or widgets.
