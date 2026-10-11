# Get tonight's first post drafted and posted

You're signed in as the admin account (marco@gopharma.ai), so /agents is yours. Right now it shows a briefing and 37 open findings, but **no marketing drafts** — the post-writing code only went in at 21:21 tonight, after the last run, so nothing has been drafted yet. This plan makes the first draft real and stops the alarms that aren't real.

## What you'll get

1. **Drafts waiting for approval.** One "UK figure of the day" post for Bluesky (and one for Mastodon), number copied word-for-word from a live official figure, with its source and a tagged link. You approve it, press "Post to my bluesky", and it appears as @ukstats.bsky.social. Nothing ever posts without your click.
2. **A briefing you can trust.** No more nightly "critical" alarms about figures the site deliberately shows as *No live feed*, and no false "page could not be fetched" or "Explained pages missing from the sitemap" reports.
3. **The live site running the same code as the preview**, with tonight's 01:00 UTC run producing tomorrow's draft.
4. **One verified live post** on @ukstats.bsky.social, so the whole chain is proven end to end.

## Steps

1. **Run the agent team once now** and confirm two drafts land in the queue. If the save fails silently, make the failure visible and fix the cause.
2. **Quiet the false alarms.** Five figures currently raise a critical "source unreachable" every night. Two of them (ethnicity and religion of irregular arrivals) are confirmed absent from the Home Office's current release — those should be a one-line note, not an alarm. The other three (OECD aid feeds, UKHSA alerts) stay as real warnings.
3. **Fix the site self-checks.** /register and /calendar are being cut off at 20 seconds and reported as "could not be fetched"; the sitemap check claims 90–153 Explained pages are missing when the live sitemap lists 100. Make both checks accurate so they only report genuine problems.
4. **Clear the explainer backlog.** 8 written explainers are sitting unapproved — I'll list them so you can approve or reject in one pass.
5. **Publish**, then confirm the scheduled 01:00 UTC run produces the first figure-of-the-day draft.
6. **Post the first draft** to Bluesky and check it's live.

## Technical details

- `src/lib/agents/engine.server.ts` — `marketingAgent()` ignores the result of the insert; check the returned error and raise a finding when a draft fails to save. Add a test beside the project's existing tests asserting a draft's body contains the published value and source verbatim, and that no draft is produced when no live figure exists.
- `feedWatchdog()` — treat `status: "no-feed"` and figures whose publisher does not collect them as informational, not critical; keep genuine outages (OECD 500, UKHSA fetch failure) as warnings.
- `seoInspector()` — raise the per-page timeout above the current 20s cut-off for /register and /calendar; validate the sitemap response actually contains a `<urlset` before counting missing Explained pages; collapse a site-wide fetch failure into one finding instead of one critical per page.
- Scheduling verified as already active: cron job `ukstats-overnight-agents` runs `0 1 * * *` (02:00 London) against the agent endpoint, and `ukstats-daily-statement` runs 06:30. Both authenticated, both active. No new scheduling needed.
- Republish after the fixes so the deployed site matches preview; the Bluesky connection flow is already live.

## How we'll know it worked

- Drafts appear in the Marketing panel on /agents with an edit box, Approve/Reject and "Post to my bluesky".
- A post is visible on @ukstats.bsky.social.
- The next morning's briefing contains no "source unreachable" entry for a figure marked *No live feed*, and no sitemap or fetch-timeout findings.
