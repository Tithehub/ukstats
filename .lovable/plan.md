# Free site + accounts: drop payments, keep donations

Two changes together: everything on UKStats becomes free with no paid tiers, funded by voluntary crypto donations only; and real accounts are added so people can sign in and keep their live pages and widgets.

## 1. Payments out, donations in

- The tier picker on `/create` is removed. Creating a live page or widget is free for everyone.
- Live pages no longer expire on a paid clock. Every page a signed-in owner creates stays live; anonymous pages get a long default window (12 months) with a one-click "keep it live" renew, so the database does not fill with abandoned links forever.
- The crypto checkout step disappears from the create flow. The four wallets (ETH, BTC, Solana, Tron) stay on `/support` with QR codes and MetaMask buttons, and a friendly "this site is free — donations keep it running" prompt appears after a page is created and in the footer.
- `payment_orders` stops being written to; the existing chain-watching code and checkout component are removed rather than left half-wired. Existing pages keep working — any page still inside its window simply becomes free and long-lived.
- No Stripe, no subscriptions, no purchasable module.

## 2. Accounts (sign-in / sign-up)

1. **`/auth`** — one page in the existing dark theme with Sign in / Create account tabs: email + password (confirmation email, "check your inbox" state) and "Continue with Google", plus a forgot-password link.
2. **`/reset-password`** — sets a new password from the emailed recovery link.
3. **Header reflects the session** — signed out shows "Sign in"; signed in shows an account menu with My pages and Sign out.
4. **My pages becomes account-aware** — pages and widgets created anonymously in this browser are claimed onto the account on first sign-in, so they survive a device change. Anonymous creation still works for people who never sign in; nothing is locked behind an account.

## The xpre.ai mailing list

Announcing UKStats to a list imported from another product is marketing email, not app email. Lovable's built-in sending covers transactional messages only, and a promotional blast from this domain would damage deliverability for the sign-up and password-reset email that must always arrive. So this work covers the app side only: transactional email stays limited to confirmation, password reset and welcome, and the announcement to the xpre.ai audience should go out from a marketing tool you control (Mailchimp, Brevo) with the list exported from xpre.ai, linking to ukstats.co.uk. A later step can add an opt-in "notify me" capture here that feeds that tool.

## Technical notes

- Delete `src/lib/tiers.ts` pricing, `src/lib/payments.functions.ts`, `src/lib/payments.server.ts` and `src/components/payments/CryptoCheckout.tsx`; keep a single `DEFAULT_PAGE_HOURS` constant plus the existing `countdown()` helper. Drop the `payment_orders` table and the `tier`/`price_pence`/`payment_status` reliance in `shared_pages` (columns kept nullable to avoid breaking existing rows).
- Auth: Lovable Cloud email/password + Google provider, configured in the same step so first sign-in works. Email confirmation stays on; no anonymous sign-ups.
- New tables with RLS and explicit grants: `profiles` (auto-created by a signup trigger, user reads/updates own row) and `user_roles` + `app_role` enum + `has_role()` security-definer function — roles never stored on `profiles`.
- `shared_pages` gains a nullable `user_id`; a claim server function matches rows by the browser's `owner_hash` and assigns them to the signed-in user.
- Routes: public `/auth` and `/reset-password`; `/my-pages` gains a signed-in view while staying usable anonymously. Public data routes stay public and SSR-rendered.
- Header session state comes from the root `onAuthStateChange` subscriber already wired for router invalidation; sign-out cancels and clears cached queries before redirecting.
- Each new page gets its own title/description metadata; `/auth` and `/reset-password` stay out of the sitemap. `roadmap.md` updated with both tasks.
