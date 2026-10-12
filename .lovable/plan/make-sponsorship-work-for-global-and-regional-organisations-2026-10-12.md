# Make sponsorship work for global and regional organisations

Today a sponsor picks one option: every page, the UK, or one single country. A company that works across Europe, or across several countries, has no way to choose that.

## What changes for sponsors

1. **Choose several places at once.** Sponsors can pick a group, any mix of countries, or both:
   - Worldwide (every page)
   - Europe (all 30 EU countries + UK pages)
   - EU only (the 30 Eurostat countries)
   - North America (US, Canada)
   - English-speaking (UK, US, Canada, Australia, Ireland)
   - Or tick individual countries (e.g. UK + Ireland + France)
2. **Clear "where you'll appear" summary** on the sign-up form, e.g. "Your banner will show on 31 country pages". Shown before payment.
3. **/advertise gets two example cards**: the existing local estate agent, plus a clearly labelled fictional global firm. That way both kinds of business can see what they get.
4. **/sponsors page** groups sponsors as Worldwide, then Regional, then by country.
5. **Admin approval in /agents** shows each sponsor's chosen regions in plain words.

## Fairness

- A page shows site-wide, group and country sponsors together in the same equal rotation. Nobody gets extra turns for buying a wider reach.
- Prices stay the same (Supporter £5/£50, Sponsor £10/£100). Changing prices is a separate decision for you.
- The existing rules still apply: no sponsors beside figures, in embeds, in widgets or on share images.

## Technical details

- Add a nullable `regions text[]` column to sponsors. Keep the old `region` column, read it as a fallback and mark it deprecated. Backfill `regions` from `region`.
- Group definitions go in `src/lib/sponsor-regions.ts` and expand to country codes from `src/lib/countries.ts`. The server checks every value is a known group or country.
- Update `sponsorsForRegion` to match a page if its region is in the sponsor's expanded list, or the list has "all". Add unit tests: Europe matches /fr and UK, but not /us; a multi-country pick matches only the countries chosen.
- Update the form in SponsorPlans, SponsorsPanel, /sponsors, the /advertise preview and the AGENTS.md rule.
- The new fictional example banner is 1536x512 and labelled "Example sponsor".
