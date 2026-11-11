# Add National Risk Register 2026 link beside Founding Documents

## What you'll see
A new card directly under the Founding Documents cards on the homepage:
- Small square thumbnail of the real front cover of the National Risk Register 2026 (on the left, same style as the document cards).
- Title "National Risk Register 2026", "Cabinet Office, published 14 July 2026, updated 12 August 2026".
- One-line plain description: the government's assessment of the most serious risks facing the UK.
- Links (open in a new tab): the official GOV.UK page, the full PDF, and the shorter "Guide to the National Risk Register 2026".
- Labelled as an official government publication, not a UKStats statistic.

## Technical details
- Render page 1 of the official PDF (assets.publishing.service.gov.uk/.../National_Risk_Register_2026.pdf) to a JPG cover thumbnail in /tmp, upload via lovable-assets, reference the .asset.json in `src/components/home/FoundingDocuments.tsx`.
- Credit line: "Cover: Cabinet Office, Crown copyright, Open Government Licence v3.0".
- Check desktop and phone in the preview. Nothing published.
