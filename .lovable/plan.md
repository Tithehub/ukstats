# Load Betfair historical files into a private test area

When the download finishes, upload the file(s) here in chat. A .tar file or a folder of .bz2 files both work.

## What you'll get
- A new private page, **Racing test data**, under the racing admin area. Only admins can see it.
- A large banner at the top: "Betfair test data — not for publication".
- **Races list:** date, course, race name, runners, and the winner and placed horses as Betfair recorded them.
- **Horse search:** each horse's runs in the files, with its finishing result.
- **Course and date filters**, plus a count of races and runners loaded.

## Rules kept
- Public racing pages, PDF reports, the stream and embeds never show this data. They keep using The Racing API.
- No odds or prices are shown, even where the files contain them. They're used only to check the data loaded correctly.
- Only results Betfair recorded are shown. Where a race has no settled result, it says "Result not recorded", never a guess.
- Only UK and Irish horse racing win markets are loaded. Everything else is skipped and counted.

## Technical details
- Betfair BASIC files are bz2-compressed JSON lines (one market per file). I'll parse them in the sandbox: take the final marketDefinition for venue, eventName, marketTime, countryCode, name, and runners with name/status/sortPriority. Runners marked WINNER are winners and REMOVED runners are non-runners.
- New tables `betfair_test_markets` and `betfair_test_runners`, with RLS on and select allowed only for has_role(admin). No anon or authenticated public access.
- Rows are bulk-inserted from the sandbox import, not from the app. Parsing is a pure function with a unit test on a sample line.
- Route `/racing/admin/test-data` uses a POST server function with requireSupabaseAuth plus an admin check. It's not linked in the public menu, only from /racing/admin.
- AGENTS.md rule: Betfair historical rows live in admin-only tables and are never read by public loaders, reports, the stream or embeds.
