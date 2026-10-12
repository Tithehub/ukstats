# Make sure Apple Pay works at checkout

## What I found

The payment page on /advertise does not limit which ways people can pay — it accepts whatever your Stripe account has switched on. The Apple Pay button you saw appears automatically on iPhones, iPads and Macs using Safari. So the remaining question is whether Apple Pay is switched on in your live Stripe account, and whether it completes a real payment.

## Steps

1. **Check the live Stripe account settings** — read the payment-method settings through the Stripe connection to confirm Apple Pay (and Google Pay) are active for checkout, not just "available".
2. **Switch Apple Pay on if it isn't** — enable it in the account's checkout settings. No code change is needed: the payment page picks it up automatically.
3. **Confirm no code blocks it** — the checkout session code already imposes no payment-method restriction; I'll leave it as is.
4. **Verify it works** — create a live checkout session and confirm Apple Pay is offered among the payment methods. A full end-to-end Apple Pay payment needs a real Apple device with a card in Apple Wallet, so the final confirmation is: when you (or a customer) pay on an iPhone or in Safari, the Apple Pay button completes the £5 payment and it shows up in your payments list.
5. **Report back** — tell you plainly whether Apple Pay is on and working, and what a customer on each device will see (Apple Pay on Apple devices, Google Pay on Android/Chrome, card everywhere else).

## Technical details

- Checkout uses Stripe embedded checkout (`ui_mode: "embedded_page"`) in `src/lib/sponsor.functions.ts`; the payment form is Stripe-hosted, so Apple Pay domain registration is handled by Stripe — nothing to upload or verify on ukstats.co.uk.
- No `payment_method_types` restriction is set, so wallets follow the account's payment method configuration.
- If the account's configuration needs changing, it is done via the Stripe API through the existing gateway connection (`createStripeClient`), not by pasting keys.
- No pricing, no sponsor logic, and no other pages change.
