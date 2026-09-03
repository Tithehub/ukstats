# Accounts for UKStats (sign-in / sign-up)

Adds real user accounts so UKStats can be sold as a module later: people sign up, own their live pages and widgets, and can be granted paid access.

## What the user gets

1. **`/auth` page** — one clean page in the existing dark theme with Sign in / Create account tabs:
   - Email + password (confirmation email on sign-up, "check your inbox" state)
   - "Continue with Google"
   - Forgot password link
2. **`/reset-password` page** — sets a new password after the emailed recovery link.
3. **Header reflects the session** — signed out shows "Sign in"; signed in shows an account menu with My pages and Sign out.
4. **My pages becomes account-aware** — pages and widgets created anonymously in this browser are claimed onto the account on first sign-in, so they survive device changes. Anonymous creation still works exactly as now for people who never sign in.
5. **Entitlements groundwork** — a per-user access record so a purchased module can be switched on for an account after payment, with an admin role that can grant it. Nothing is charged in this step; the existing crypto checkout stays as it is.

## The xpre.ai mailing list

Announcing a purchasable module to a list imported from another product is marketing email, not app email. Lovable's built-in sending is for transactional messages only, and sending a promotional blast from this domain would damage deliverability for sign-up and password-reset email that must always arrive. So this work covers the app side only:

- Transactional email here stays limited to confirmation, password reset and welcome.
- The announcement to the xpre.ai audience should go out from a marketing tool you control (Mailchimp, Brevo, etc.) with the list exported from xpre.ai, linking to ukstats.co.uk.

If you want, a later step can add a proper opt-in "notify me" capture on UKStats that feeds that marketing tool.

## Technical notes

- Auth: Lovable Cloud email/password + Google provider (configured in the same step so first sign-in works). Email confirmation stays on; no anonymous sign-ups.
- New tables, each with RLS and explicit grants:
  - `profiles` (id -> auth user, display name, created_at), auto-created by a signup trigger; user reads/updates own row.
  - `user_roles` + `app_role` enum + `has_role()` security-definer function — roles never live on `profiles`.
  - `entitlements` (user_id, product, active, granted_at) — user reads own; only admin/service role writes.
- `shared_pages` and widget rows gain a nullable `user_id`; a claim server function matches rows by the browser's `owner_hash` and assigns them to the signed-in user. Existing anonymous flow is unchanged.
- Routes: public `/auth` and `/reset-password`; the account area (`/my-pages`, later the paid module) moves under the `_authenticated` layout while public data routes stay public and SSR-rendered.
- Header session state driven by the root `onAuthStateChange` subscriber already wired for router invalidation; sign-out cancels and clears cached queries before redirecting to `/auth`.
- Each new page gets its own title/description metadata; `/auth` and `/reset-password` are excluded from the sitemap.
