# Restore Britain colours and an independent dedication

## Bottom-of-page banner
- Add a permanent dedication band to the shared footer, separate from the rotating paid sponsor banners, on pages that use the site footer.
- Use your uploaded Restore Britain logo unchanged, on a light surface so its navy lettering remains readable. Keep UKStats as the site's name and main logo.
- Suggested message:

  **For Rupert Lowe, the Restore Britain team, and the people**

  “UKStats was built independently as a free resource for Rupert Lowe, the Restore Britain team, and the public. Access to the statistics is free of charge. Funding comes from voluntary donations and clearly labelled business sponsorships, giving local businesses a place to share their details and supporting their visibility and growth.”

  “This is an independent dedication, not an official Restore Britain service or a claim of endorsement. Sponsors have no influence over the figures.”

- Include **Sponsor your local business** linking to the existing sponsorship page and **Donate** linking to the existing support page.
- Do not add this dedication to embedded figures, widgets or share images.

## Whole-site colours
- Base the theme on **#051D3F**, the dominant navy sampled from your uploaded logo, with white and cool neutral surfaces. This is a colour sampled from the supplied image, not an unverified claim about an official brand guide.
- Update both light and dark themes consistently: page backgrounds, navigation, buttons, links, borders and panels. Retain the light/dark switch and existing fonts.
- Preserve green, amber and red for data freshness and official alerts so their meanings do not change.
- Leave sponsor artwork, source data, pricing and country coverage unchanged.

## Funding and independence
- Keep both donations and existing sponsorship plans available; do not describe sponsorship as the only funding source.
- Emphasise local-business participation without restricting existing worldwide or regional sponsors or changing their prices.
- Keep the ban on political-party and campaign-group paid sponsorship. The dedication is not a paid sponsor listing.

## Technical details
- Store the uploaded logo through Lovable Assets and reference its returned asset pointer; do not regenerate it.
- Add a dedicated footer section and use the existing shared footer to display it, rather than adding a sponsor record.
- Apply the palette through the existing semantic tokens in `src/styles.css`, including the legacy aliases used throughout the site.
- Record the confirmed design and funding preferences in project memory and the shared-footer placement rule in `AGENTS.md` during implementation.
- No new data requests, payment changes or changes to statistics collection.

## Checks and delivery
- Check the home page, a country page, the rankings page and sponsorship page in light and dark modes at phone, tablet and desktop sizes.
- Confirm logo readability, message wrapping, colour contrast, working donation/sponsorship buttons and unchanged sponsor rotation.
- Prepare and verify the changes in preview; publishing to ukstats.co.uk remains a separate approval.