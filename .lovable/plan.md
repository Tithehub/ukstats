# Rent UKStats: finish the full streamer service (before payments)

The basics already work in preview:
- streamer dashboard
- branded stream page
- watch page
- admin on/off switch

This plan turns that into a finished, polished service you can test end to end. Payments come after.

## What gets built

1. **Guided setup (/rent/dashboard).** A clear 4-step setup replaces the single long form:
   1. Name and web address, with a live "available / taken" check
   2. Branding: logo upload (PNG/JPG/SVG up to 2 MB, stored with us), accent colour and "Presented by"
   3. Countries and layout, showing a picture of each layout
   4. Presenter and sponsor box

   A live preview of the stream sits beside the steps and updates as settings change, even before the channel is switched on.
2. **All four layouts working.** Classic, data wall (figures larger, globe smaller), split (half globe, half figures) and portrait each change the stream itself. Today only portrait does.
3. **Request activation.** A "Request activation" button on the dashboard shows "Pending review" until you approve it. A notice appears in your admin panel.
4. **Admin page (/rent/admin).** A proper admin page lists every channel with its status, owner email and date requested. Each row has buttons to approve, pause and grant features, and opens a preview of that channel. It stays limited to admins.
5. **Customer status and help.** The dashboard shows Pending, Active, Paused or Expired, and a "Your stream is live" checklist covering:
   - OBS link
   - camera tips in self-presenter mode
   - test-stream advice
   - a copy button for the public watch link
6. **A better watch page (/s/name).** A branded header with their logo and colour, the stream, share buttons, and a "Powered by UKStats" link.
7. **Design pass.** All rent pages get the same navy news style with clear steps and works on phones. The pages are /rent, the dashboard, the admin page and the watch page.

## Then payments and packages (same build)

8. **Checkout on the dashboard.** "Choose your plan" works out the price from the choices: £9 base, +£3 per extra country or +£19 for all countries, +£10 AI presenter, +£49 to remove the sponsor box, and 25% off for the first 10. Checkout opens on the page. Payment is monthly, sold as digital goods.
9. **Automatic access.** After payment, the channel switches on with exactly the features bought. After cancelling, it stays live until the end of the paid month. A failed payment shows a warning. Your manual grants are never overwritten.
10. **Manage billing.** A button lets customers change their card, see invoices or cancel.

## Full test-mode walkthrough (done by me, shown to you)

I'll run the whole journey as a new test customer in test mode, using Stripe's test card `4242 4242 4242 4242` (no real money), and send you screenshots of each step:
1. sign up
2. set up the channel and upload a logo
3. see the price
4. pay
5. return to "Active"
6. the branded stream live in OBS size
7. the watch page
8. open billing and cancel
9. confirm the stream stays live until the paid month ends

If any step fails I'll fix it and re-run before reporting.

## Technical details

- **Database changes:**
  - `rent_channels`: add `status` ('draft', 'pending', 'active' or 'paused', default 'draft') and `requested_at`
  - an admin-only function that returns owner emails for the admin page
- **Logo storage:** a public `rent-logos` bucket. Owners can upload only to their own folder (`<uid>/...`), and the logo link is taken from that upload.
- **Server functions (POST):**
  - `checkSlug`, which says whether a web address is free
  - `requestActivation`
  - `adminSetChannelStatus`, which reuses the role check
  - entitlements: approving sets `active=true`, pausing sets `active=false`
- **Stream layouts:** `BroadcastView` gets a `variant` prop (classic, data-wall or split) that switches between absolute-position presets for the 1920×1080 frame. `/globe/broadcast` keeps classic.
- **Preview mode:** a signed-in owner can open `/s/$slug/broadcast?preview=1` even when the channel isn't active. It's checked through their session and watermarked "Preview — not live".
- **Tests:**
  - slug rules
  - status changes: an owner can only move a channel from draft to pending, and only an admin can approve or pause
  - preview works only for the owner
- **Stripe products** (`txcd_10000000`, GBP, monthly):
  - `rent_stream_base` £9
  - `rent_extra_country` £3, quantity-based
  - `rent_all_countries` £19
  - `rent_ai_presenter` £10
  - `rent_no_sponsor_box` £49
- **Checkout:** `createRentCheckout` builds the line items from `rent-pricing.ts`, using embedded checkout with `managed_payments`. Subscription metadata `kind=rent` keeps it separate from sponsors. The founding coupon applies while fewer than 10 rent subscriptions exist.
- **Webhook:** for `kind=rent`, it upserts `rent_entitlements` with `source='stripe'`. Rows with `source='manual'` are never touched.
- **Portal:** `createRentPortal` opens the billing portal for the customer's own Stripe account only.
- Tests check that line items total `monthlyPence`, and how subscription items map to features.
- Update the stream folder's AGENTS.md note and roadmap.md.
