# Betfair delayed key: save it and test once more

The key you pasted is now in chat, so I won't copy it into the site's code. It goes into the private secure store instead.

## Steps
1. Open the secure form so you can save the delayed key as the Betfair app key. This replaces the one already stored. Please paste it there yourself.
2. Try one Betfair login from our server, and fetch one day of UK horse racing markets with the delayed key.
3. If Betfair answers: build the private, admins-only test area from the earlier plan. It would be labelled "Betfair test data — not for publication" and never shown publicly.
4. If Betfair still blocks us (the earlier block came from the server's location, not the key): stop and build nothing. The way forward then is for you to download the free historical files from your UK computer and upload them here.

## Unchanged
- Public racing pages keep using The Racing API free plan.
- No scraping, no odds shown publicly, and nothing goes into reports, the stream or embeds.

## Technical details
- Secret name: BETFAIR_APP_KEY, updated through the secure form.
- The test is a single login request to identitysso plus listMarketCatalogue. If it returns 403 or BETTING_RESTRICTED_LOCATION, we stop.
