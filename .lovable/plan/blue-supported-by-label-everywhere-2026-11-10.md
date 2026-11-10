## Blue "Supported by" label everywhere

The Orbit stream's sponsor box already uses the bright blue label. Make the older classic stream layout's "Supported by" badge match it: a bright blue badge with navy lettering, replacing the red one. This keeps the label the same colour on every stream layout.

### Technical
- `src/components/stream/BroadcastView.tsx` line ~510: change `bg-destructive ... text-destructive-foreground` to `bg-sponsor-tag text-primary-foreground`, or navy text if the primary token isn't navy.
- Check the classic layout's sponsor card in a screenshot (`/globe/broadcast?layout=classic`). Don't publish.
