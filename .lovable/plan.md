# A ready-to-approve improvement plan every morning

## What you'll get
Every night the agent team writes one full **Improvement Plan** and waits. Nothing on the site changes. When you wake up, open /agents and you'll see:

1. **Summary**: what the agents found overnight, in plain English.
2. **Ranked tasks (up to 10)**: each one shows what to build, why it matters, the evidence behind it, how big the job is (small, medium or large) and how we'll know it worked.
3. **Approve / Skip on each task**, plus **Approve all**.
4. **"Copy build request" button**: it turns the approved tasks into one message. Paste that to me in chat and I build them.

## Where the ideas come from
- Overnight findings from the six agents: broken feeds, revised figures, stale dates, site problems.
- Visitor numbers: which pages people leave straight away, and where they come from.
- Gaps against our own roadmap, such as world indicators, country pages, email alerts and local search.
- Official figures we list a source for but don't yet show.

## Rules the plan must follow
- It never proposes inventing, estimating or changing a figure.
- It never proposes auto-posting, paid placements next to figures, or turning donations back on while the legal hold is in place.
- Tasks that need something from you, such as your Google account or an email sender, are marked "Needs you".
- If AI credits run out, there's no plan that night and /agents tells you why.

## Technical details
- New table `improvement_plans` (run_id, summary, tasks jsonb, created_at). Each task has: title, why, evidence, size, success_check, needs_user, status (pending/approved/skipped). RLS is admin-only via has_role, with grants.
- New final step `plannerAgent` in src/lib/agents/engine.server.ts, run after the Chief of Staff. Its input is that night's findings, the open roadmap.md items and a 30-day analytics summary. It uses aiJson with a strict schema (default model) and has a cap of 10 tasks. A rule filter drops any task that breaks the no-fabrication, funding-hold or auto-posting rules.
- New server functions in agents.functions.ts (POST, admin-checked): getLatestPlan and setTaskStatus.
- New ImprovementPlanPanel at the top of /agents, with per-task Approve/Skip, Approve all and Copy build request (clipboard).
- Keeps the existing 02:00 UK nightly schedule; this is checked with list_http_schedules.
- Tests: the filter rejects banned tasks, the plan is capped at 10 tasks, and the copied text includes only approved tasks.
- I run the team once after building, so a first plan is waiting for you.
