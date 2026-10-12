# Example sponsor preview on /advertise

## Goal
Show businesses exactly what they get for each plan, using a made-up estate agent. The example appears **only on the /advertise page**, inside a box clearly labelled "Example — not a real sponsor". It never appears in the real footer or near any figures, so nobody mistakes it for a real paying sponsor.

## What gets built
1. **Fictional sponsor**: "Harbour & Hale Estate Agents" (made-up name, link goes nowhere real — points back to /advertise), tagline "Local property experts since 2009".
2. **"See what you get" section**, placed directly under the plan cards on /advertise:
   - A mock of the site footer in the real colours and fonts, with the actual "Supported by" line.
   - **Supporter (£5/£50)**: shows the line with name + link only, rotating among other supporters.
   - **Sponsor (£10/£100)**: same line, with the tagline added and shown first.
   - A Supporter/Sponsor switch so the preview follows the plan being looked at.
   - Small notes pointing at each part: "Your name", "Your link", "Your tagline (Sponsor only)", "Shown on every page".
3. **Clear "where you won't appear" note**: never next to figures, embeds, widgets or share images — this is the trust promise sponsors are buying into.
4. Example badge on the box, so screenshots of it can't be passed off as a real sponsorship.

## Not doing
- No fake sponsor in the real footer or database.
- No figures invented for the mock (it shows the footer only, no stats).

## Technical details
- New `src/components/sponsor/SponsorPreview.tsx` reusing SponsorStrip's markup/styles with a static example prop (no database read), rendered in `src/routes/advertise.tsx` after `SponsorPlans`.
- Theme tokens only; no changes to SponsorStrip's live behaviour, webhook or tables.
