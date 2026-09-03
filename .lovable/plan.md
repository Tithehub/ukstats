# NHS & Doctors section

A new "NHS & doctors" category in the register, built to the existing card design: value, source, coverage, reference period, data age badge (Fresh / Ageing / Overdue), next scheduled release, official link, dark and light themes.

## Source reality (checked before planning)
Automated requests to NHS England statistics pages **and** their data files are answered with an AWS WAF bot challenge; NHS Digital and the GMC return 403. So the England figures cannot be read automatically today. Per your decision, those cards ship as explicit **"No live feed"** cards — official link, publisher, coverage, publication cadence and the next release date, never an invented or estimated number. Each card re-attempts the publisher on every refresh and fills itself in automatically the moment the feed responds.

NHS Scotland's open data API does respond, so Scottish equivalents ship as real live figures alongside, each labelled with its coverage.

## Cards

### Key indicators (top of the section, also surfaced in Vital Signs)
| Indicator | Source | Coverage | State at launch |
| --- | --- | --- | --- |
| NHS HCHS doctors (FTE) | NHS Digital workforce statistics | England | No live feed |
| Fully qualified GPs (FTE) | NHS Digital GP workforce | England | No live feed |
| Elective RTT waiting list | NHS England RTT | England | No live feed |
| A&E 4-hour performance (%) | NHS England A&E | England | No live feed |

### Workforce & medical training
- International medical graduates (%) — GMC register — UK-wide — No live feed
- NHS medical and nursing vacancies, count and rate — NHS Digital — England — No live feed
- Consultant vacancies (WTE and rate) — NHS Scotland open data — Scotland — live
- Nursing and midwifery vacancies (WTE and rate) — NHS Scotland open data — Scotland — live

### Secondary and emergency care
- Cancer 62-day treatment performance (%) — NHS England — England — No live feed
- Cancer 62-day performance (%) — NHS Scotland Cancer Waiting Times — Scotland — live
- Category 2 ambulance mean response — NHS England AQI — England — No live feed
- Adult acute bed occupancy (%) — NHS England sitreps — England — No live feed
- Elective inpatient/day case waits — NHS Scotland Stage of Treatment — Scotland — live

Every card names its geography in the card itself, so England-only figures are never read as UK-wide.

## Technical notes
- Add `"NHS & doctors"` to `CATEGORIES` in `src/lib/uk-stats.ts`; the register, home page and category navigation pick it up generically.
- New collector module wired into `collectStats()` in `src/lib/uk-stats.functions.ts`, inside the existing soft-deadline/stale-while-revalidate machinery so a slow or blocked publisher never delays a page render.
- England collectors attempt the official publisher with browser-style headers and the existing retry/backoff; on a WAF challenge, 403 or empty body they return a metric with `status: "unavailable"`, `emptyLabel: "No live feed"`, a `note` explaining that the publisher blocks automated access, plus source URL, cadence and next release date.
- Scotland collectors read the NHS Scotland CKAN API (`opendata.nhs.scot`), taking the latest published period from the dataset resources, with `hasHistory` where the series supports it so `/history/$metricId` works.
- Add the section to the sitemap-relevant page metadata and to the widget/embed metric list so NHS cards can be embedded like the rest.
