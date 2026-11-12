# Bigger in-game stats banner and Rule Britannia theme

## Stats banner
- Make the bottom banner easy to read: about twice the current size (roughly 14px bold text in a ~30px band on desktop, slightly smaller on phones but still clearly readable).
- Match the game's look: same deep navy bar as the score bar at the top, bold white lettering, gold labels and a red divider between figures, like an arcade ticker.
- Still the real published figures only (small boats, irregular arrivals, UK debt, foreign aid, income tax vs welfare) with their period; "Not published" where there is no figure.
- Still out of the way: taps pass through during a run, it sits on the very bottom edge, and the game area stays the same size.

## Music
- Replace the current theme with a retro chiptune arrangement of "Rule, Britannia!" (Thomas Arne, 1740 — out of copyright), looping the "Rule, Britannia! Britannia rule the waves" chorus with a bouncy bass line and drum ticks.
- The Music on/off button and the remembered on/off choice work as before.

## Technical details
- LiveStatsStrip.tsx overlay variant: bg-night/85, Archivo bold, text-[14px] (text-[12px] on coarse pointer), gold label colour token, red separator; slower scroll so it's readable.
- game-music.ts: swap the melody/bass note arrays for the Rule Britannia chorus (G major, 3/4 feel adapted to the existing square/triangle oscillators); the start/stop API stays the same.
- Check with a screenshot at desktop and phone sizes.
