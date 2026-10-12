# UKStats — the UK National Data Register

**[ukstats.co.uk](https://ukstats.co.uk)** — every major UK official statistic in one place, with its source, its age, and the date the next figure is due. Now covering 33 countries across Europe, North America and Australia.

## The golden rule

**Nothing on this site is estimated, modelled or interpolated.** Every figure is pulled from an official, machine-readable source — ONS, Home Office, police.uk, HM Land Registry, Eurostat, national statistics offices — and displayed with its reference period and a link to the publisher. Where no live feed exists, the site says so plainly instead of guessing.

## What it does

- **Live register** of UK crime, debt, migration, borders, cost of living, housing, defence, weather and more
- **33 country pages** (`/fr`, `/de`, `/us`…) with comparable Eurostat and national figures, weather warnings and capital weather (clearly labelled as model data)
- **Freshness metadata everywhere** — how old each figure is, and when the next release is due
- **Revision tracking** — when a publisher quietly restates a figure, the site records it
- **Public JSON/CSV API** and **embeddable widgets** for every metric
- **Nightly agent team** that checks feed health, detects revisions, audits data and drafts (never posts) social updates — humans approve every post
- **Online speech convictions** comparison — an honest map of which countries publish these figures and which do not

## Running it locally

```sh
git clone https://github.com/Tithehub/ukstats.git
cd ukstats
npm i
cp .env.example .env   # fill in your own public Supabase keys
npm run dev
```

Tests: `npm test` (Vitest). Typecheck: `npx tsgo --noEmit`.

## Architecture

- **TanStack Start** (React 19, SSR) on a Cloudflare Workers-style edge runtime
- **Lovable Cloud** (Supabase) for storage of snapshots, findings and drafts
- Pure, testable parsers for every source (`src/lib/eurostat.ts`, `src/lib/national.ts`, `src/lib/alerts.ts`) — network code is server-only (`*.server.ts`)
- The overnight agents live in `src/lib/agents/` and are triggered by cron via `/api/public/agents-tick`. **Agents can only write findings, drafts and revisions — never figures and never code.**

## Contributing

Yes please. Read [CONTRIBUTING.md](CONTRIBUTING.md) — the short version: every number needs an official source, and "we don't have that figure" is always a better answer than an invented one.

## Licence

MIT (see [LICENSE](LICENSE)). The code is yours to reuse; the statistics remain the copyright of their publishers and must keep their attribution.

---

Built by Marco Mead with [Lovable](https://lovable.dev). Not a government service.
