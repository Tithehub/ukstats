# Reports button on the homepage

## What changes
- A new **"Daily, monthly & yearly PDF reports"** button goes in the top welcome section, alongside "Open interactive globe" and "All UK statistics". It opens the Reports page.
- Directly beneath the buttons, one short line:
  "Every stat you can see on UKStats stays completely free, forever. Reports are an optional download-ready PDF from £1."
- It works the same on phone and desktop: the buttons wrap and the line sits underneath them.

## Technical details
- Edit `src/components/home/UkLanding.tsx`: add a `Link to="/reports"` button (FileText icon, outline style) to the welcome button row, then add a small muted paragraph below that row. Use design tokens only.
