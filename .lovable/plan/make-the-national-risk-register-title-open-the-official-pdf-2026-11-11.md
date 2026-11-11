# Make the National Risk Register title open the official PDF

Clicking the card title "National Risk Register 2026" (and its cover thumbnail) will open the official full report PDF straight from GOV.UK in a new tab, instead of the GOV.UK summary page.

- The PDF stays hosted by GOV.UK, so readers always get the official, current copy (no re-hosted file to go out of date).
- The "Full report" and "Short guide" links stay as they are.
- Desktop and phone checked in preview. Nothing published.

## Technical details
In src/components/home/FoundingDocuments.tsx, change the title link href to the assets.publishing.service.gov.uk National_Risk_Register_2026.pdf URL and wrap the thumbnail in the same link.
