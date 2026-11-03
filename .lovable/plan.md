# ACLED: nothing to build until ACLED grants data access

I followed your instructions with your saved login, using both sign-in methods they describe:

- **Token sign-in** (the method the site uses): sign-in accepted, data request answered "Access denied".
- **Cookie sign-in** (the browser/Postman method): sign-in accepted, data requests answered "Access denied", including for ACLED's main dataset and its smaller "deleted events" list.

So the site is connecting exactly as ACLED documents. ACLED is refusing data to this account, and no change on our side can fix that.

## What you need to do
- Log in at acleddata.com and check your account page for a data or API access request, or terms to accept.
- If there's nothing there, email ACLED's access team: "My myACLED login works, but every API read request returns 403 Access denied. Please enable API data access for my account."

## What happens after that
- No build work is needed. Within about 15 minutes of ACLED enabling access, the globe's research dots switch on by themselves, labelled "ACLED research, not official".
- If you approve this, I'll make one small change: add a check that runs ACLED's own example request (`read?limit=10`) so the globe's message can tell "no data access yet" apart from "ACLED is down".
