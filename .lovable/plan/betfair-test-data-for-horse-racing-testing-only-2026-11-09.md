# Betfair test data for horse racing (testing only)

## Links for you
- **Free developer key:** in the [Accounts API Demo Tool](https://apps.betfair.com/visualisers/api-ng-account-operation/), log in to betfair.com in another tab, pick "createDeveloperAppKeys", enter a unique app name and press Execute. Copy the **Delayed** key, the one marked Active. [Step-by-step guide](https://support.developer.betfair.com/hc/en-us/articles/19192200541468-How-do-I-create-an-Application-Key)
- **Free historical data:** [historicdata.betfair.com](https://historicdata.betfair.com/). Choose Horse Racing on the free BASIC plan, add the months you want, and "purchase" them for £0. They then appear under My Data.

## What I'll build once you have them
- A private test area on the racing admin page, visible to admins only, never on public pages, reports or the stream:
  - Real UK races, runners and winners from Betfair, using the delayed key.
  - Past UK races and winners from the free historical files, to test horse histories and win rates.
- Every item is labelled "Betfair test data — not for publication". Nothing from Betfair appears on the public site until their terms allow it.
- Public racing pages keep using The Racing API free plan exactly as now.

## What I'll ask you for
- Through the secure form, not in chat: the Betfair Delayed app key, plus your Betfair username and password, which the API needs to log in.

## Technical details
- Secrets: BETFAIR_APP_KEY, BETFAIR_USERNAME, BETFAIR_PASSWORD. Interactive login goes to identitysso.betfair.com and returns a session token, which is cached on the server.
- `src/lib/racing/betfair.server.ts`: listMarketCatalogue (eventTypeId 7, GB marketCountries, WIN markets, today to +2 days) and listMarketBook for runner status (WINNER, LOSER or REMOVED), mapped into the existing MeetingRow/ResultRow shapes with pure, tested mappers.
- Historical data uses the Historical Data API (GetMyData, DownloadListOfFiles, DownloadFile) for BASIC files. It parses market definitions for course, race, runners and winner, and is stored in payload_cache under "betfair-test-v1".
- Admin-only POST server function (requireSupabaseAuth plus a has_role admin check) feeding a new "Test data" tab on /racing/admin.
