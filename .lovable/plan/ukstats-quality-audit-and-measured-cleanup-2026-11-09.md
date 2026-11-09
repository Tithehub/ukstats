# UKStats quality audit and measured cleanup

## Goal
Make the existing site clearer, faster and dependable across phones, tablets and desktops. Treat “world class” as an ambition backed by evidence, not an unsupported label.

X setup stays paused. Nothing is published. Horse racing remains hidden on public sites. Neither the old live stream nor the unfinished Orbit stream is redesigned in this work.

## Confirmed starting point
- Navigation already has five grouped sections, page search and a phone bottom bar: improve these rather than introduce another navigation system.
- The homepage contains repeated routes to topics and repeated presentations of debt and small boats, alongside statistics, independent links and paid services.
- A local browser check found horizontal overflow at 768px: the page measured 822px wide. The tested 390px, 927px and 1440px widths did not overflow.
- Those checks reported no page errors or broken images at the time tested. They are not a complete functionality or performance audit.
- Earlier cleanup tasks remain in the roadmap; reassess them rather than automatically merge pages or add features.

## 1. Audit and baseline
- Inventory public pages and shared layouts; cover UK and world branding, statistics, comparisons, education, inquiry/media pages, reports and services.
- Exercise priority journeys: find a figure, inspect its source/date, compare places or countries, open the globe, watch the current stream, find reports and sponsorship information.
- Test at 360, 390, 768, 927, 1280 and 1440px, plus keyboard navigation, 200% zoom, reduced motion, loading, missing data and recoverable failures.
- Record findings by severity, affected page, reproducible evidence and user impact. Separate measured failures from hypotheses.
- Establish repeatable speed and accessibility baselines on the homepage and representative priority pages. Published-site observations remain read-only.

## 2. Fix the highest-impact problems
- Correct verified overflow, overlaps, clipped figures and inaccessible controls first, including the tablet homepage issue.
- Strengthen homepage hierarchy: statistics first; clear paths to register, globe and live stream; independent material and optional paid services remain distinct and reachable.
- Reduce duplicate navigation and competing calls to action without removing requested content, altering original introduction wording or replacing approved imagery.
- Refine grouped menu, page search and phone navigation: consistent active states, readable labels, focus handling, dismissal and uninterrupted access to page content.
- Apply consistent typography, spacing, cards and controls through shared design tokens. Preserve the established identity and publisher warning colours; do not restyle official levels.
- Fix verified broken buttons, empty states and loading failures. Improve expensive media loading only where measurements support it; preserve a working interactive globe and current stream.
- Do not change figures, calculations, payment policies, permissions or sources under the guise of presentation cleanup. Document any separately scoped issue.

## 3. Acceptance gauges
| Area | Target and evidence |
|---|---|
| Layout | No unintended horizontal page scrolling, clipped essential text or obscured controls at the tested widths and 200% zoom |
| Accessibility | WCAG 2.2 AA-oriented checks: contrast at least 4.5:1 for normal text and 3:1 for large text; visible focus; keyboard-completable priority journeys; no serious/critical automated findings on audited pages |
| Touch | Aim for 44×44px primary touch controls; document justified exceptions and spacing |
| Speed | Target LCP ≤2.5s, CLS ≤0.1 and field INP ≤200ms; use repeated mobile lab tests for development and report field measurements only when available |
| Journeys | All scripted priority journeys succeed, with source and reference dates accessible; repeat destination links on audited pages resolve correctly |
| Reliability | No uncaught browser errors during the tested journeys; explicit loading, unavailable and retry states where applicable |
| Trust | Preserve sourced values, provenance and missing-data labels; clearly separate statistics, social/editorial material and commercial placements |

Automated accessibility scores do not establish full compliance. Local development timing does not establish production Core Web Vitals. Human ease-of-use claims require user testing: provide a short five-task test with success rate and completion-time recording rather than invent results.

## 4. Verify and hand over
- Re-run the same checks after fixes and provide a before/after scorecard, screenshots and an honest list of remaining limitations.
- Run relevant existing tests; add focused tests for any changed functional rules, not styling snapshots.
- Keep a lean cleanup task list in the existing roadmap after approval, including the paused X task. Finish actionable tasks and identify external blockers.
- Leave all changes in preview for review; no publishing or paid services introduced.

## Technical approach
- Work in existing shared layout and home modules first, then affected content pages; use the established TanStack routing, Query caching and design components.
- Locate overflow culprits in rendered layouts before editing; prefer targeted fixes over broad rewrites.
- Keep source collection unchanged unless a verified failure requires separately scoped work. Retain last-good data and explicit feedback.
- Keep route-specific metadata intact and verify audited pages' titles, descriptions and sharing tags.
- Record structural decisions in AGENTS.md and keep repeatable verification checks with the project.