# Test-mode message on the live site's checkout

## What I've confirmed
- The live site's settings hold the **live** payment key, and the live site on ukstats.co.uk is serving it — the page itself shows no test-mode note.
- The website code picks test or live from that key automatically, so a fresh payment started now should open in live mode.
- The most likely cause of what you saw: your browser was still showing an older copy of the page from before the live key went out, so the payment form opened in test mode.

## Plan

### 1. You: clear the old copy
- On ukstats.co.uk/advertise, do a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac).
- Click a plan to open the payment form and tell me if you still see anything saying test mode.

### 2. Me: prove it end-to-end
- Sign in to the live site as you (using the secure session I already have), open the £5 Supporter checkout, and screenshot the payment form.
- Confirm the form is a live Stripe checkout (no test-mode label) and that Apple Pay / card options appear.
- I will not complete any payment — just open the form and check.

### 3. If it still says test mode
- Check the live server's payment keys are the live pair, fix whatever is pointing at test, and republish.

## Not in this round
- The £5 payment itself — still yours to make with your real card once we've confirmed the form is live.
