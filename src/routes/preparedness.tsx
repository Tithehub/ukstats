import { createFileRoute } from '@tanstack/react-router';
import { ExternalLink, Search, Droplets, CalendarDays } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/button';
import { PREPAREDNESS_CHECKED } from '@/lib/preparedness.data';
import { filterPreparedness, PREPAREDNESS_REGIONS, type PreparednessRegion } from '@/lib/preparedness';
import { fmtDate } from '@/lib/uk-stats';

export const Route = createFileRoute('/preparedness')({
  validateSearch: (s: Record<string, unknown>): { region: PreparednessRegion; q: string } => ({
    region: (PREPAREDNESS_REGIONS as readonly string[]).includes(String(s['region'])) ? s['region'] as PreparednessRegion : 'all',
    q: typeof s['q'] === 'string' ? s['q'].slice(0, 200) : '',
  }),
  head: () => ({ meta: [
    { title: 'Be prepared — official government emergency advice | UKStats' },
    { name: 'description', content: 'How many days of food and water governments advise households to keep at home, quoted from official UK and international sources.' },
    { property: 'og:title', content: 'Be prepared — official government advice' },
    { property: 'og:description', content: 'Official household emergency supply advice from the UK and other governments, with direct source links.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ], links: [{ rel: 'canonical', href: 'https://ukstats.co.uk/preparedness' }] }),
  component: PreparednessPage,
});

function PreparednessPage() {
  const { region, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const items = filterPreparedness(region, q);
  return <div className="min-h-dvh bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase text-electric-soft">Official government advice</p>
      <h1 className="mt-2 text-4xl font-semibold">Be prepared</h1>
      <p className="mt-3 max-w-3xl text-lg text-night-muted">What governments advise households to keep at home in case of an emergency — quoted exactly as published, with a link to each official source.</p>
      <p className="mt-4 text-xs text-night-muted">Sources checked {fmtDate(PREPAREDNESS_CHECKED)}. Only governments whose official page we could open and confirm are listed.</p>
      <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-night-line py-4">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Region">
          {PREPAREDNESS_REGIONS.map(r => <Button key={r} variant={region === r ? 'secondary' : 'ghost'} aria-pressed={region === r} onClick={() => void navigate({ search: { region: r, q } })}>{r === 'all' ? 'All' : r}</Button>)}
        </div>
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-night-line bg-night-panel px-3">
          <Search className="size-4 shrink-0 text-night-muted" />
          <input aria-label="Search countries" value={q} onChange={e => void navigate({ search: { region, q: e.target.value }, replace: true })} placeholder="Search countries" className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none" />
        </label>
      </div>
      <p role="status" className="my-5 font-mono text-xs text-night-muted">{items.length} {items.length === 1 ? 'country' : 'countries'}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(a => <article key={a.code} className="rounded-md border border-night-line bg-night-panel p-5">
          <p className="font-mono text-[11px] uppercase text-night-muted">{a.region}</p>
          <h2 className="mt-1 text-xl font-semibold">{a.country}</h2>
          <p className="text-sm text-night-muted">{a.publisher}</p>
          <blockquote className="mt-4 border-l-2 border-electric pl-3 text-base">“{a.quote}”</blockquote>
          {a.waterQuote && <p className="mt-3 flex gap-2 text-sm"><Droplets className="mt-0.5 size-4 shrink-0 text-electric-soft" aria-hidden="true" />“{a.waterQuote}”</p>}
          <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs text-night-muted">
            <div><dt>Days advised</dt><dd className="text-night-fg">{a.days ? `${a.days}` : 'Not stated as a number'}</dd></div>
            <div><dt>Water / person / day</dt><dd className="text-night-fg">{a.waterLitresPerPersonPerDay ? `${a.waterLitresPerPersonPerDay} litres` : 'Not stated in litres'}</dd></div>
            <div className="col-span-2 flex items-center gap-1"><CalendarDays className="size-3" aria-hidden="true" />Published: {a.published ? fmtDate(a.published) : 'date not stated'} · Checked {fmtDate(PREPAREDNESS_CHECKED)}</div>
          </dl>
          <Button asChild variant="outline" className="mt-4"><a href={a.url} target="_blank" rel="noopener noreferrer">Official source<ExternalLink /></a></Button>
        </article>)}
      </div>
      {!items.length && <p className="py-16 text-night-muted">No countries match this search.</p>}
      <p className="mt-10 text-sm text-night-muted">Links to suppliers will be added later, once the current legal hold on sponsorship and payments is lifted.</p>
      <p className="mt-3 text-xs text-night-muted">These are official recommendations, not statistics. UKStats is independent and reproduces each government’s wording without adding to it. New Zealand’s litres figure is derived from its stated nine litres for three days.</p>
    </main>
    <SiteFooter />
  </div>;
}
