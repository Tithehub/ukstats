# Cheaper report subscriptions, one shared cover, free growth push

## 1. Report prices (daily prices stay the same)
Daily stays UK £1 and Global £2.50. Subscriptions get bigger discounts and show a clear "save X%" badge:

| Plan | Now | New | Saving vs paying daily |
|---|---|---|---|
| UK monthly | £19.99 | £9.99 | about 67% |
| UK yearly | £199 | £79 | about 78% |
| Global monthly | £49.99 | £24.99 | about 67% |
| Global yearly | £499 | £199 | about 78% |

These new amounts are my suggestion; tell me if you want different ones. People already subscribed keep their current price until they renew or cancel.

## 2. One shared cover for both reports
- A single cover design for both the UK and the Global report, same navy branding, all-white UKStats logo and fonts.
- The artwork combines the world globe and the UK map into one picture, with the UK drawn in brighter white so it stands out. The style stays the same.
- Only the title line changes ("Daily UK report" / "Daily Global report"), so buyers still know which one they have.
- I'll check every page of a sample of each report before you see it.

## 3. Free growth push (no paid ads)
- Re-run the basic search checks and fix anything broken first (page titles, descriptions, broken links).
- Update the saved growth plan; the next open steps are Reddit replies with sourced charts, and reviewing visits from social, Reddit and Hacker News (due 22 Nov).
- Write ready-to-post captions and share pictures for the cheaper subscriptions and the live stream, with tracked links. You post them yourself.

## Technical details
- Prices: `REPORT_PRICES` in src/lib/reports.ts plus new Stripe prices under the same price IDs (replacing old amounts); update reports.test.ts saving percentages and the pdf-reports memory.
- Cover: replace the cover art in src/lib/report-pdf.ts with one combined image (globe + brighter-white UK outline), made by editing the existing cover art, with the title as the only per-edition text.
- Growth: seo_chat findings, update /mnt/documents/marketing/plan.md, new posting kit file.
- Nothing is published without your go-ahead.
