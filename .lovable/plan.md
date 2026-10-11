# Next best move: make UKStats the best in its class

## How UKStats compares
- **ONS homepage and real-time dashboard**: official and embeddable, but limited to ONS figures. No crime, Home Office, MOD, threat levels or polling in one place.
- **Our World in Data**: excellent charts and explainers, but focused on the world and slow to update UK figures.
- **data.gov.uk and the UK Data Service**: raw files for researchers. No dashboards or freshness labels.
- **UKHSA dashboard**: health only.

What only UKStats does: every UK publisher in one place, with how old each figure is, when the next release is due, and no invented numbers. The gap is the "why": the others explain figures better, and they are faster and more trusted.

## Recommended next move: "Every figure, answered"
For each tracked figure, turn its page into a full answer page:
1. **What changed**: the change since the last release, a one-year view and a ten-year view, worked out from published values only.
2. **Explainer**: extend the 10 explainers to every figure, taken from the publisher's methodology notes.
3. **Embed and cite**: chart image download (PNG), a citation with the date, and an embed code on every figure.
4. **Revision tracking**: show when a publisher revised a past figure (we already save snapshots). No competitor does this, and journalists value it.
5. **Faster first view**: all pages should first load in under 1 second, using the cached snapshot already built.

## Also in this sprint
- Run a fresh security scan before sharing the site widely.
- Accessibility check on keyboard use and colour contrast.

## Waiting on you
- Email alerts need a sending domain.
- Google Search Console needs your Google account.

## Technical notes
- Extend /explained/$metricId to all metrics with a generic template driven by metadata; write unique head() per metric.
- Revisions: diff metric_snapshots for the same period key; expose through a security-definer rpc.
- PNG export happens on the user's device, from the chart SVG.
