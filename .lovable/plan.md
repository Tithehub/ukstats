# Sign-up numbers on the admin Agents page

## What you'll see
A "Sign-ups" card at the top of the admin-only Agents page, showing:
- Total accounts
- New in the last 24 hours, the last 7 days and the last 30 days
- The date of the first sign-up
- A small day-by-day bar chart for the last 30 days

Only admins can see it. Everyone else gets nothing back, even if they ask for it directly.
No names or emails are shown, just counts.

## Technical details
- New server function `getSignupStats` in src/lib/agents.functions.ts (method POST, requireSupabaseAuth, has_role admin check via context.supabase, then supabaseAdmin loaded inside the handler to count rows in public.profiles by created_at, which the sign-up trigger fills in).
- Returns plain counts plus a 30-day daily series, with days split on London time.
- New SignupStatsCard on /agents, loaded with useQuery and useServerFn from the component, not the route loader.
- Add one test for the day-bucketing helper (London-day boundaries).
