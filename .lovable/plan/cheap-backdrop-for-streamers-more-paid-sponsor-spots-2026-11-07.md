# Cheap backdrop for streamers, more paid sponsor spots

The idea: the stream backdrop is priced so low that lots of streamers use it. Every backdrop carries UKStats sponsor spots, so each new streamer gives sponsors more screens. Most of the income comes from the sponsors.

## 1. Lower streamer prices (Rent UKStats page)
| Item | Now | New |
|---|---|---|
| Stream backdrop, 1 country, sponsor box included | £199 | **£9 a month** |
| Each extra country | £25 | **£3** |
| Every country | £399 | **£19** |
| AI presenter | £50 | **£10** |
| Present it yourself (camera + autocue) | included | included |
| Remove UKStats sponsor box | n/a | **£49 a month** (optional) |

The founding offer stays at 25% off for the first 10 customers. Widgets, dashboard and data feed prices don't change.

## 2. More ways to sell sponsor spots
- **Network sponsor box:** one sponsor at a time, each with their own QR code, on our stream and on every rented backdrop. The page shows how many screens they appear on, counting only real, verified backdrops.
- **Sponsor prices:**
  - Network title sponsor: £299 a month, 1 slot, named in the presenter's 15-minute breaks.
  - Network sponsor: £99 a month, up to 10 slots.
  - Country sponsor (shown only on that country's backdrops and pages): £49 a month, 1 slot per country.
  - Topic page sponsor: unchanged.
- **Advertise page:** shows the new sponsor options and live Stripe checkout. Admin approval and the banned categories still apply.

## 3. Publish
I'll publish this together with sponsorship being switched back on.

## Technical details
- Update `rent-pricing.ts`:
  - New constants: `stream` at 900 pence, `EXTRA_COUNTRY_PENCE` 300, `WHOLE_PACKAGE_PENCE` 1900, `AI_PRESENTER_PENCE` 1000.
  - New `noSponsorBox` option at 4900 pence.
  - When the config has no stream, whole-package and country add-ons apply only to the products the customer chose.
- Update `rent-pricing.test.ts` with these values, and update the rent page copy and toggle.
- Create Stripe prices: `network_title_monthly` £299, `network_sponsor_monthly` £99 (quantity 1), `country_sponsor_monthly` £49. Add them to the SponsorPlans list.
- Slot caps are enforced server-side in `sponsor.functions.ts`.
- Update the white-label and monetisation memory files.
