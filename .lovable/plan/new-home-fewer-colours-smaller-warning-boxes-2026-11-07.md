# /new-home: fewer colours, smaller warning boxes

- **No more green or amber boxes.** Small boats and inflation go back to the original navy box, with the small fresh/ageing label kept as text.
- **Red and yellow stay**, but only for official warning levels: the terror threat (Severe) and Met Office warnings (Yellow). If a level is ever amber or green, that box stays navy too.
- **Smaller boxes:** less padding, smaller icons, slightly smaller numbers and lower height, so all six fit tighter (three across on desktop, two across on phone).
- The colour key line underneath changes to: "Red and yellow are the publisher's own warning levels."

## Technical details
- statusTone returns only red, yellow or plain. Amber, green and freshness all map to plain. Update status-tone.test.ts to match: Severe → red, yellow → yellow, amber/green/fresh → plain.
- Tile: min-h-44 → min-h-32, p-5 → p-4, icon size-11 → size-9, value text-3xl/4xl → text-2xl/3xl, grid-cols-2 on phone.
