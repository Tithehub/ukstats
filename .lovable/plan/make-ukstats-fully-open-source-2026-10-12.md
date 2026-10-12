# Make UKStats fully open source

## Goal
Put the whole UKStats codebase on a public GitHub repository so anyone can read it, suggest fixes, and contribute improvements — while keeping your admin keys, social tokens and database private.

## What's already true (checked)
- The project has no LICENSE file yet — without one, nobody legally has permission to reuse the code.
- `.gitignore` does not exclude `.env`. Today `.env` only holds public publishable keys, but it must be excluded before going public so future secrets never leak.
- All real secrets (Bluesky/Mastodon tokens, cron secret, admin keys) live server-side in Lovable Cloud, not in the code — good.
- Database migrations live in `supabase/migrations` and `drizzle/migrations`, so contributors can see the full schema.
- README is still the default Lovable template text.

## Steps

1. **Licence the code** — add an MIT `LICENSE` file (the standard, most permissive choice; lets anyone reuse the code with credit). Note: the licence covers your code, not the underlying statistics, which remain Crown copyright / Eurostat etc. and are already attributed on the site.

2. **Protect secrets**
   - Add `.env` to `.gitignore`.
   - Add a `.env.example` showing which variables a contributor needs (public Supabase URL + publishable key only), with placeholder values.

3. **Rewrite README.md** — what UKStats is, the "real official figures only, never invented" rule, screenshots, how to run it locally (`npm i`, `npm run dev`), how the nightly agents work, and how to contribute.

4. **Add contributor files**
   - `CONTRIBUTING.md` — the golden rule (no fabricated figures; every number needs an official source), how to add a new metric or country, how to run tests.
   - `CODE_OF_CONDUCT.md` — standard Contributor Covenant.
   - GitHub issue templates (bug report, data correction, new source suggestion).

5. **Connect GitHub** — you do this in the Lovable editor: Plus (+) menu → GitHub → Connect project → Create Repository. After that, every change made in Lovable syncs to GitHub automatically, and anyone's pull request you merge on GitHub syncs back into Lovable. Then flip the repo to **public** on GitHub.

6. **Final safety sweep before going public** — search the whole codebase for any hardcoded tokens, passwords or private URLs; confirm nothing sensitive is in git history. (The tokens you pasted in chat were never written into the code, but I'll verify.)

7. **Announce** — add a "Open source" link in the site footer pointing at the repo, and have the Marketing agent draft a "UKStats is now open source" post for your approval.

## What stays private
- Your database contents, admin account, Bluesky/Mastodon tokens and cron secret — none of these are in the code.
- The published site keeps running on Lovable exactly as now; open sourcing changes nothing for visitors.

## Technical notes
- MIT licence file at repo root, copyright "Marco Mead / UKStats".
- No code changes needed beyond README/docs/footer link; no database changes.
- The two-way GitHub sync is a built-in Lovable feature — no CI setup required.
