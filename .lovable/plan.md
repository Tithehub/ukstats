# Fix: scandal pictures and titles missing on the live stream

The stream already has a scandals panel that should show each scandal's site picture and title. On the live stream it isn't appearing, so the cause needs confirming before the fix.

## Step 1 — Confirm the cause (on the published site, not just preview)
- Open ukstats.co.uk/globe/broadcast with the clock set to the scandals slot (just after the half-past headlines) in both UK hours, and screenshot it.
- Check three likely causes:
  1. The published site is an older version without the panel.
  2. Another card (the "About UKStats" promo) takes the panel's place during that slot.
  3. In the second UK hour her lines are reworded, so the panel can't match the line she's reading and sticks on the first scandal, or the slot is skipped.
- Check the pictures load from the published address.

## Step 2 — Fix what Step 1 finds
- Make the scandals panel always win over the promo during the scandals slot.
- Pick which scandal to show from her position in the slot, not by matching wording, so the picture and title change exactly as she starts each one, in both UK hours.
- If a picture fails to load, show the navy panel with the scandal's title instead of a blank.

## Step 3 — Check
- Screenshots of all three scandals in the slot, in both UK hours, on the main layout.
- Add an automatic check that every scandal in the slot has its picture and title.
- Voice timing stays unchanged; rented streams still don't carry scandals. Nothing published without your go-ahead.
