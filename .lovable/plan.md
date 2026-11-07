# Rent UKStats: Stage 2, payments and plans

Stage 1 is built in preview: the stream dashboard, branded stream pages, watch page and the admin on/off switch. This stage connects checkout so channels switch on and off automatically.

## What customers get

1. **Build your plan on /rent and pay.** The prices are the ones already shown:
   - £9/month base, one country included
   - +£3 per extra country, or +£19 for all countries
   - +£10 for the AI presenter
   - +£49 to remove the sponsor box

   Sign-in is required. Payment is a monthly subscription, sold as digital goods.
2. **Founding discount.** The first 10 streamers get 25% off.
3. **Automatic access.** After payment, the channel switches on with exactly the features bought. It stays live until the end of the paid month after cancelling. If a payment fails, a warning shows and the channel stays on while Stripe retries.
4. **Manage billing.** A button on /rent/dashboard lets customers change their card, see invoices, cancel or upgrade.
5. **Your overrides.** The admin panel can still grant features by hand, for example free trials or partners. Manual grants are never overwritten by Stripe.

## Technical details

- **Stripe products** (tax code `txcd_10000000`, monthly, GBP), with prices kept in sync with `rent-pricing.ts`:
  - `rent_stream_base` £9
  - `rent_extra_country` £3, quantity-based
  - `rent_all_countries` £19
  - `rent_ai_presenter` £10
  - `rent_no_sponsor_box` £49
- **Checkout:** `createRentCheckout` (POST, signed in) builds the line items from the dashboard choices and uses embedded checkout with `managed_payments`. Subscription metadata `kind=rent` keeps it separate from sponsorships. The founding coupon is applied while fewer than 10 rent subscriptions exist.
- **Webhook:** for `kind=rent`, it upserts `rent_entitlements` with `source='stripe'`, working out the features from the subscription items. Sponsor handling is unchanged. A test makes sure manual rows are not overwritten.
- **Portal:** `createRentPortal` is limited to the customer's own Stripe customer.
- **Tests:** checkout line items total `monthlyPence`, the mapping from items to entitlement, and the founding cap.
