# Overnight Agent Team for ukstats.co.uk

## What is possible
I can't change the site's code while you're away. That only happens in our chats. What I can build is a team of AI agents that run every night on the site's own backend. They check, audit and draft improvements, and leave a morning report with suggestions. You approve a suggestion with one click, or bring it to me to build. None of them can publish a figure, invent a number or post to socials without your approval.

## The team (runs nightly, 02:00–05:00 UK time)
1. **Feed Watchdog**: re-checks every official feed. It flags broken, late or overdue releases against the calendar and retries any failures. It writes to /status.
2. **Revision Detective**: compares tonight's published values with stored snapshots for the same period. It logs any figure a publisher has quietly revised. This is the feature no competitor has.
3. **Data Auditor**: sanity-checks each figure, such as unit jumps, impossible values, stale "next release" dates and missing source links. It only flags problems. It never changes a figure.
4. **Explainer Writer**: drafts better plain-English "Explained" text for figures that only have the automatic version. It uses only the publisher's own methodology text and source details. Drafts wait for your approval before they appear.
5. **SEO & Accessibility Inspector**: crawls the live site for broken links, missing page titles, sitemap gaps and contrast or keyboard issues.
6. **Chief of Staff**: reads the other agents' findings and writes one prioritised **Morning Briefing**: what broke, what changed, what it suggests next. You read it at /agents. You can also have it emailed once email sending is set up.

## What you'll see
- An **/agents** page, for admins only, with tonight's briefing, each agent's findings, and Approve/Dismiss buttons on drafts.
- A public **Revisions** log on each figure's Explained page.
- A **Run now** button for testing.

## Safety rails
- Agents can read the site's data and write findings and drafts. They can't change live figures, code or socials.
- Each nightly run has a limit on how much it does. If one is already running, a second won't start.
- If AI credits run out, the team stops itself and shows why.
- AI usage is billed to your workspace credits. A nightly run is expected to be small.

## Technical section
- Tables: agent_runs (lock + status), agent_findings (agent, severity, metric_id, detail, status), explainer_drafts, metric_revisions. RLS on all of them: admin-only via has_role, and revisions are public-read through a security-definer rpc.
- Entry point: /api/public/agents-tick (bearer cron secret), scheduled by pg_cron. Each agent is a step with its own bounded batch, idempotent progress, and a circuit breaker on 402/403/429.
- AI: Lovable AI Gateway, default model via Responses (streamed), strict JSON-schema outputs. Used only by the Explainer Writer and the Chief of Staff. The other agents are deterministic code.
- Approved explainer drafts override genericExplainer text in /explained/$metricId.
- Requires an admin account (has_role 'admin') for /agents. I'll grant it to your sign-in email.
