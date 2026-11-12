# Sign-up required to play games

## What changes
- The Games page (/games) stays open to everyone so people can see the games, artwork and leaderboards, and so search engines and shared links still show previews.
- Every game page (Daily 5, Higher or Lower, Guess the Number, Rank the World, Guess the Flag, Britain by the Numbers, English History, World Knowledge & History, Aim High, Vote Lowe) shows a friendly sign-up screen instead of the game when the visitor isn't signed in:
  - Game artwork and title, "Sign up free to play and get ranked on the leaderboard"
  - "Create account" and "Sign in" buttons; nickname tip ("use a nickname, not your real name")
  - After signing up or in, the player returns straight to the game they chose.
- Game cards on /games and the homepage Games banner say "Free — sign up to play".
- Terms/privacy wording updated: an account is needed to play.

## Technical details
- Shared `GameSignInGate` component wrapping each game's play area; reads the session via the existing auth state; renders the game only when signed in. Game routes stay public (SSR, OG tags unchanged) rather than moving under `_authenticated`, so share previews keep working.
- Pass the game path as a redirect to the auth page and navigate back after sign-in.
- Server scoring endpoints already require auth for saving; guest round-generation endpoints get an auth check too so the gate can't be bypassed.
- Add a test that the gate hides the game for signed-out visitors.
