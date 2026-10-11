# Add an admin-only "Agents" button to the site navigation

## What you'll see

Once this is in, signing in as marco@gopharma.ai makes an **Agents** button appear in the top bar (and in the menu drawer on smaller screens). Pressing it opens the morning briefing at `/agents`. Sign out, or sign in as a non-admin, and the button is simply not there — nobody else can tell the page exists.

Nothing about the page itself changes: it still checks your admin rights on the server before showing anything.

## How it works

1. **A small admin check the header can use.** A new `useIsAdmin()` hook in `src/lib/useIsAdmin.ts` reads your signed-in session, then asks the backend the same question the coverage page already asks — "is this user an admin?" — via the existing `has_role` function. The answer is remembered per account for the rest of the visit, so it costs one quick lookup, not a lookup on every page view. When you sign out it resets.
2. **The button itself.** `src/components/layout/SiteHeader.tsx` gains one nav entry (`/agents`, the bot icon already used elsewhere in the header). It renders in the desktop bar as the last item, and in the drawer as its own **Admin** group — only while `useIsAdmin()` says yes. Non-admins and signed-out visitors get markup identical to today's.
3. **The door stays locked either way.** The `/agents` page keeps its current server-side gate (`getAgentDashboard` plus `assertAdmin` on every action). Hiding the button is presentation only; a non-admin typing the address still sees "This page is for site admins only", and every approve/post/dismiss action is still refused server-side.

No database changes, no new permissions, no new backend code — the role check the button uses is the one already in place and already granted to signed-in users.

## Verification

- Build is clean and the existing test suite still passes.
- In the preview: signed out, the header shows no Agents button; after signing in as the admin account, the button appears in the top bar and the drawer, and clicking it lands on the briefing with your findings and drafts.
- A non-admin session (or the same browser after signing out) shows no button and still gets the admins-only message at `/agents`.

## Technical details

- `src/lib/useIsAdmin.ts` (new): `useAuth()` for the session, then `supabase.auth.getUser()`-backed `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })` — the same pattern as `src/routes/coverage.tsx:207-213`. Returns `{ isAdmin, checking }`. Module-level `Map` cache keyed by user id so the RPC runs at most once per account per page load; cleared on `SIGNED_OUT` by the existing root auth listener.
- `src/components/layout/SiteHeader.tsx`:
  - Desktop: `{isAdmin ? <Link to="/agents" ...>Agents</Link> : null}` appended after the `PRIMARY` items (line 118-131 block), reusing the existing nav-item classes so active/hover/focus styling matches.
  - Drawer: an extra group `{ name: "Admin", items: [{ to: "/agents", label: "Agents", icon: Bot }] }` rendered only when `isAdmin`, after the existing `NAV_GROUPS` map (line 189-209). `Bot` is already imported (line 6).
  - The drawer's `Link` list is typed against `NavItem.to: string`, so no route-tree typing changes are needed.
- Deliberately not added: the public footer, `sitemap.xml`, or `robots.txt` — the page carries `noindex` and should stay undiscoverable to the public.
- No migration: `public.has_role(uuid, public.app_role)` already has `EXECUTE` for `authenticated` (migration `grant_has_role_to_authenticated`), so the client RPC resolves for signed-in users and is denied to `anon`.
