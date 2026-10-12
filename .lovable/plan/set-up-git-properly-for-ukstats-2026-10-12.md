# Set up Git properly for UKStats

## Where things stand (checked just now)

- Your repository https://github.com/Tithehub/ukstats exists and is public — but it has **zero commits**. Nothing has been copied into it yet.
- The site footer, the README instructions and both pending announcement posts already point at that address.
- The open-source paperwork is in the project: MIT licence, contributor guide, code of conduct, three issue templates, and `.env` excluded from sharing.
- Lovable pushes automatically once the link is working. There is no manual "push" button, and "Re-check" only compares the two sides — it does not send anything.

## Step 1 — Read the sync status (you, about 1 minute)

Open **Project settings → Git → GitHub**, or the **+** beside the chat input → **Project → GitHub**.

The panel should show **Connected**, a sync-status card, a branch picker and the repository name.

- It says something like **"Lovable is N commits ahead of GitHub"** → the link is fine, the first push simply hasn't run. Go to Step 2.
- It does not say Connected, the repository isn't listed, or a check failed → go to Step 4.

## Step 2 — Get the first push moving

Ask me to make any small change, or make one in the editor — Lovable commits and pushes edits on the synced branch, normally `main`. Wait a couple of minutes, then reload the repository page and tell me. I'll confirm from here that the files have arrived.

## Step 3 — Once files appear, finish the GitHub page (you, about 3 minutes)

- **Description:** UK official statistics register — every figure from an official source, with its age and next release date.
- **Website:** https://ukstats.co.uk
- **Topics:** statistics, uk, official-data, open-data
- Leave **Public** switched on.
- Check the README renders, the licence reads MIT, and the three issue templates appear under "New issue".

## Step 4 — If it stays empty, reset the link

In the same panel choose **Disconnect**, confirm, then **Connect** again.

Important: reconnecting creates a **new** repository containing the current code. The empty one cannot be reused, because Lovable cannot attach to an existing repository. Send me the new address and I'll point the footer, README and both posts at it.

## Step 5 — Then release the announcement

Only once the code is actually visible: approve and post the two "we're open source" drafts in /agents.

## Optional — protect the repo as it grows

I can add a small automated check so every contribution is tested before you merge it: it runs the project's tests and the type check on each pull request and shows a red or green tick against the change.

## Everyday workflow after this

```text
change in Lovable  ->  appears on GitHub automatically
pull request merged on GitHub  ->  appears back in Lovable
publishing the live site  ->  still a separate button
```

## Technical notes

- The sandbox cannot push: git state is managed by Lovable and the push runs from the editor side. The local edit branch holds the footer/README commit; the shared `main` is one commit behind it.
- Optional check would be `.github/workflows/ci.yml` running `bun install`, `bunx vitest run` and `tsgo --noEmit` on `pull_request` and on pushes to `main`. `package.json` has no `test` script, so the workflow calls vitest directly.
- `.env` appears in one early commit and holds only public publishable keys. `.gitignore` now excludes `.env` and `.env.*` except `.env.example`. No real secrets exist in the history (verified).
- Places holding the repository address, to update if a new repo is created: the footer link, the README clone line, and the two pending announcement posts.
