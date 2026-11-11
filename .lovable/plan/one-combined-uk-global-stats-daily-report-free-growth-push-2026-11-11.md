# One combined "UK & Global Stats" daily report, free growth push

## 1. One report instead of two
- The UK and Global daily PDFs merge into a single report: **UK & Global Stats**. It has the UK section first, then the global section.
- Buyers see one product with four choices: daily, weekly, monthly, yearly. There is no longer a UK-or-Global choice.

| Plan | Price | Saving vs paying daily |
|---|---|---|
| Daily | £0.75 | — |
| Weekly | £2.49 | about 53% |
| Monthly | £9.99 | about 56% |
| Yearly | £99 | about 64% |

People who already subscribed to the old UK or Global plans keep full access to the combined report until their plan ends. Old daily purchases stay in their archive.

## 2. One cover
- Same branding: navy background, the same all-white UKStats logo, the same fonts.
- Title: **UK & Global Stats**.
- Cover picture: the existing globe and UK map art combined into one image, with the UK in brighter white so it stands out. The style stays the same.
- I'll check every page of a sample report before showing you.

## 3. Free growth push (no paid ads)
- Re-run the basic search checks and fix anything broken first.
- Update the saved growth plan. Next steps: Reddit replies with sourced charts, then reviewing visits from social, Reddit and Hacker News (due 22 Nov).
- Ready-to-post captions and share pictures for the new combined report and the live stream, with tracked links, for you to post.

## Technical details
- reports.ts: replace the six price entries with one edition ("combined") and four new price IDs (report_combined_daily/weekly/monthly/yearly) as new Stripe products/prices; keep old IDs recognised for existing subscribers' access and archives; update reports.test.ts, pricing pages and the pdf-reports memory.
- report-pdf.ts: build one document from the UK and global sections; single cover with title "UK & Global Stats" and new combined art made by editing the existing cover images.
- Growth: seo_chat findings, update /mnt/documents/marketing/plan.md, new posting kit file.
- Nothing is published without your go-ahead.
