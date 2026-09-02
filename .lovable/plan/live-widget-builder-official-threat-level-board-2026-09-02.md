# Live widget builder + official threat-level board

Two additions to the register: a proper embeddable live widget (with a builder page so anyone can configure and copy it), and a national alert-status board on the main page that reproduces each governing body's own scale and colour coding.

## 1. Threat & alert status board (main page)

A new band directly under the debt masthead showing the UK's standing official alert levels, each rendered with the scale that the responsible body actually publishes — not our own freshness colours.

Levels included, all live from official sources:

- **National terrorism threat level** — JTAC/MI5 via GOV.UK. Official 5-step scale: Low, Moderate, Substantial, Severe, Critical, drawn as a 5-segment ladder with the current step marked.
- **Northern Ireland-related terrorism threat level** — same GOV.UK page, same 5-step scale, shown separately because it is set separately.
- **Met Office severe weather warnings** — official Yellow / Amber / Red National Severe Weather Warning Service colours, showing what is currently in force (or "no warnings in force").
- **Environment Agency flood warnings** — live flood-monitoring API. Official three-step scale: Flood alert, Flood warning, Severe flood warning, with current counts in force for England.
- **UKHSA heat/cold health alerts** — official Green / Yellow / Amber / Red weather-health alert scale, shown when in force.

Rules that apply to all of them:

- Colours and wording are the issuing body's own. No invented scale, no blending them into one composite "UK threat score".
- Each tile states the issuing body, when the level was last set/updated, and links to the official page.
- If a feed cannot be read, the tile says so plainly with the source link — never a default "Low"/"Green".
- Each tile carries the same provenance and embed controls as the existing metric cards.

## 2. Live embeddable widget

Today the embed is a single fixed metric iframe. This adds:

- **`/widget` builder page** — pick one metric, a small group, a whole category, or the threat board; choose light or dark, compact or full, and whether to show provenance. Live preview updates as you choose, with the copy-paste iframe snippet beneath it.
- **`/embed/...` upgraded** — accepts multiple metric ids plus theme/size options, auto-sizes, refreshes its data on a timer so an embedded widget stays live, and always renders source + age + next-due so provenance travels with the widget.
- **Threat board embed** — the alert board is embeddable as one unit, keeping each body's official colours.
- Widget footer always credits the underlying official sources and links back to the register.

## Technical notes

- New normalisers in `src/lib/uk-stats.functions.ts`: Met Office warnings feed, Environment Agency `flood-monitoring/id/floods`, UKHSA alert page, plus splitting the existing NI threat text out of `threatLevel()` into its own metric.
- `Metric` gains an optional `scale` field (`{ kind: 'terror' | 'metoffice' | 'flood' | 'ukhsa', steps, current }`) so the UI can draw the official ladder; existing metrics are unaffected.
- New `ThreatTile` / `ThreatBoard` components; new scale colour tokens added to `src/styles.css` alongside the existing fresh/ageing/overdue tokens.
- `embed.$metric.tsx` becomes a splat/search-param route supporting `?ids=`, `?theme=`, `?density=`; existing single-metric embed URLs keep working.
- Widget height is reported to the host page via `postMessage` with an optional resizer snippet.

After the build I will screenshot the main page and the widget so you can see the design.
