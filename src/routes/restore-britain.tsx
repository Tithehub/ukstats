import { createFileRoute } from '@tanstack/react-router';
import { Play, ExternalLink, Search, Youtube, FileText } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { RestoreSignupCta } from '@/components/RestoreSignupCta';
import { Button } from '@/components/ui/button';
import { RESTORE_CHANNEL, RESTORE_MEDIA_CHECKED, type RestoreMediaItem } from '@/lib/restore-media.data';
import { filterRestoreMedia } from '@/lib/restore-media';
import { fmtDate } from '@/lib/uk-stats';

type Kind = 'all' | RestoreMediaItem['kind'];
export const Route = createFileRoute('/restore-britain')({
  validateSearch: (search: Record<string, unknown>): { kind: Kind; q: string; page: number } => ({
    kind: search['kind'] === 'video' || search['kind'] === 'short' || search['kind'] === 'story' ? search['kind'] : 'all',
    q: typeof search['q'] === 'string' ? search['q'].slice(0, 200) : '',
    page: Math.max(1, Math.floor(Number(search['page']) || 1)),
  }),
  head: () => ({ meta: [
    { title: 'Restore Britain — official videos & stories | UKStats' },
    { name: 'description', content: 'Browse Restore Britain’s official YouTube videos, Shorts and published policy stories, with original thumbnails and direct publisher links.' },
    { property: 'og:title', content: 'Restore Britain — official videos & stories' },
    { property: 'og:description', content: 'Official-channel videos and publisher stories in a separate, attributed archive on UKStats.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ], links: [{ rel: 'canonical', href: 'https://ukstats.co.uk/restore-britain' }] }),
  component: RestoreMediaPage,
});

function RestoreMediaPage() {
  const { kind, q, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const items = filterRestoreMedia(kind, q);
  const pages = Math.max(1, Math.ceil(items.length / 24));
  const current = Math.min(page, pages);
  const visible = items.slice((current - 1) * 24, current * 24);
  return <div className="min-h-dvh bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase text-electric-soft">Official channel & publisher archive</p>
      <h1 className="mt-2 text-4xl font-semibold">Restore Britain</h1>
      <p className="mt-3 text-lg text-night-muted">Videos, Shorts & stories</p>
      <p className="mt-4 max-w-3xl text-sm text-night-muted">Published by Restore Britain. These are political communications and proposals, not official statistics. UKStats is independent; inclusion does not imply endorsement or affiliation.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="outline"><a href={RESTORE_CHANNEL} target="_blank" rel="noopener noreferrer"><Youtube />Official YouTube channel<ExternalLink /></a></Button>
        <Button asChild variant="outline"><a href="https://www.restorebritain.org.uk/papers" target="_blank" rel="noopener noreferrer"><FileText />Official policy stories<ExternalLink /></a></Button>
      </div>
      <p className="mt-5 text-xs text-night-muted">Archive checked {fmtDate(RESTORE_MEDIA_CHECKED)} · 125 videos · 154 Shorts · 14 policy stories. All public entries retrieved from the channel’s Videos and Shorts tabs and the policy-story index on that date; private/deleted content and future uploads are not included. Older video publication dates are not supplied by the archive.</p>
      <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-night-line py-4">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Media type">
          {([['all', 'All'], ['video', 'Videos'], ['short', 'Shorts'], ['story', 'Stories']] as const).map(([value, label]) => <Button key={value} variant={kind === value ? 'secondary' : 'ghost'} aria-pressed={kind === value} onClick={() => void navigate({ search: { kind: value, q, page: 1 }, replace: false })}>{label}</Button>)}
        </div>
        <label className="flex w-full min-w-[220px] flex-1 items-center gap-2 rounded-md border border-night-line bg-night-panel px-3">
          <Search className="size-4 shrink-0 text-night-muted" />
          <input aria-label="Search videos and stories" value={q} onChange={e => void navigate({ search: { kind, q: e.target.value, page: 1 }, replace: true })} placeholder="Search videos and stories" className="min-h-11 min-w-0 w-full bg-transparent text-sm outline-none" />
        </label>
      </div>
      <p role="status" className="my-5 font-mono text-xs text-night-muted">{items.length} results · Page {current} of {pages}</p>
      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(item => <article key={item.id} className="min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block focus-visible:outline-2 focus-visible:outline-electric" aria-label={`${item.kind === 'story' ? 'Read' : 'Watch'}: ${item.title}`}>
            <div className="relative aspect-video overflow-hidden rounded-md border border-night-line bg-night-panel">
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-[1.02] motion-reduce:transform-none" />
              {item.kind !== 'story' && <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-md bg-night text-electric-soft"><Play className="size-5" aria-hidden="true" /></span>}
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase text-night-muted">Restore Britain · {item.kind === 'story' ? 'Policy story' : item.kind === 'short' ? 'YouTube Short' : 'YouTube video'}{item.published ? ` · ${fmtDate(item.published)}` : ''}</p>
            <h2 className="mt-2 break-words text-base font-semibold leading-snug group-hover:text-electric-soft">{item.title}</h2>
          </a>
        </article>)}
      </div>
      {!items.length && <p className="py-16 text-night-muted">No videos or stories match this search.</p>}
      <nav aria-label="Archive pages" className="mt-10 flex items-center justify-between gap-3 border-t border-night-line pt-5">
        <Button variant="outline" disabled={current <= 1} onClick={() => void navigate({ search: { kind, q, page: current - 1 } })}>Previous</Button>
        <span className="text-sm text-night-muted">{current} / {pages}</span>
        <Button variant="outline" disabled={current >= pages} onClick={() => void navigate({ search: { kind, q, page: current + 1 } })}>Next</Button>
      </nav>
      <RestoreSignupCta />
    </main>
    <SiteFooter />
  </div>;
}