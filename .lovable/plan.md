# Retry ACLED with the address ACLED gave you

The globe already sends its requests to `https://acleddata.com/api/acled/read`, so the address isn't the problem. What hasn't been tried is the plain call ACLED suggests, `?limit=10` with no filters.

## Steps
1. Sign in with your saved ACLED login and make exactly that call (`read?limit=10`).
2. **If it returns events:** the trouble is our filters (date range and event types), not your account. I'll change the globe's request to use only filters your account tier accepts. If date filtering is blocked, I'll fetch recent records and keep the last 30 days on our side. Then I'll confirm the yellow research dots appear on the globe, still labelled "research, not official".
3. **If it still says "Access denied":** your account isn't cleared for data yet. I'll leave the globe as it is, still saying "ACLED account has no data access yet", and tell you exactly what ACLED answered so you can pass it to their access team.

## Technical details
- `src/lib/unrest.server.ts`: adjust the query string (and add `_format=json` if needed), keeping OAuth, the 15-minute cache and the last-good fallback.
- Add or extend a `parseAcled` test if the response shape differs.
- Preview only. Nothing is published unless you ask.
