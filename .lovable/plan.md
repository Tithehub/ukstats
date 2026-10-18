# Keep the agents improving the site overnight

## The honest answer
The agents can work every night, but they can't change the site's code or publish anything. Only our chats can do that. What they can do is find problems, check every figure and draft improvements. Each morning you get a short list of ready-to-approve items, and one "build these" message to me turns them into real changes.

## What gets added
1. **Nightly ideas list ("Next improvements")**: every night the Chief of Staff reads the findings, feed failures, visitor stats and search gaps, and writes the top 5 improvements, ranked by impact. Each idea gets a one-line reason and the evidence behind it, such as "/maps had 12 visits and 90% left straight away".
2. **New-source scout**: checks the official publishers we already list (World Bank, ONS, Eurostat, national offices) for figures we don't show yet. It suggests them with the exact official link and never makes up a value.
3. **World rankings checker**: each night it checks all 20 world figures for stale years, missing countries and sudden jumps, and flags anything odd.
4. **One-click hand-off**: a "Copy build request" button on /agents puts the approved ideas into one message you paste to me in the morning.
5. **Confirm the schedule**: make sure the 02:00 UK run fires every night, and show an alert on /agents if a night is missed.

## What stays the same
- No figure is ever invented, changed or estimated by an agent.
- Nothing posts to socials or goes live without your click.
- AI use stays small and is charged to your workspace credits. The team stops itself if credits run out.

## Technical details
- New steps go in src/lib/agents/engine.server.ts: `improvementPlanner` (AI, strict JSON schema, input = findings + analytics summary + feed status), `sourceScout` (deterministic: compares the publisher catalogues with the metrics we already have), and `worldAuditor` (deterministic: checks the payload_cache "world-bank" data for lag and outliers).
- Results are written to agent_findings with the new kinds "idea" and "source-suggestion". They show in a new "Next improvements" section on /agents with Approve/Dismiss buttons. The "Copy build request" button builds the message from the approved ideas.
- Check the schedule with supabase--list_http_schedules. Add a missed-run finding when the last agent_runs entry is more than 26 hours old.
- Tests check that the planner output never contains a numeric figure that isn't already in the payload, and that source suggestions always include an official URL.
