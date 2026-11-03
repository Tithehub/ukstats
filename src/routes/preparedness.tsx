import { createFileRoute } from '@tanstack/react-router';
import { ExternalLink, Search, Droplets, CalendarDays, ArrowRight, Check, ShieldCheck, ClipboardCheck, Heart, Flashlight, FileText, House, Users } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/button';
import { PREPAREDNESS_CHECKED } from '@/lib/preparedness.data';
import { filterPreparedness, PREPAREDNESS_REGIONS, type PreparednessRegion } from '@/lib/preparedness';
import { fmtDate } from '@/lib/uk-stats';
import { PREPAREDNESS_PRODUCTS } from '@/lib/preparedness-products';
import { PreparednessKitCard } from '@/components/PreparednessKitCard';
import householdImage from '@/assets/preparedness-household.jpg';
import essentialImage from '@/assets/preparedness-essential.jpg';
import householdKitImage from '@/assets/preparedness-household-kit.jpg';
import familyKitImage from '@/assets/preparedness-family-kit.jpg';

const KIT_IMAGES = [essentialImage, householdKitImage, familyKitImage];
const CHECKLIST_GROUPS = [
  { name: 'Water & food', icon: Droplets, items: ['Drinking water', 'Non-perishable food', 'Manual tin opener', 'Special dietary supplies'] },
  { name: 'Lighting & power', icon: Flashlight, items: ['Torch', 'Spare batteries', 'Power bank', 'Battery or wind-up radio'] },
  { name: 'Health & hygiene', icon: Heart, items: ['First-aid kit', 'Essential medication', 'Hand sanitiser', 'Wet wipes', 'Basic toiletries'] },
  { name: 'Warmth & shelter', icon: House, items: ['Blankets', 'Warm clothing', 'Sleeping bags where appropriate'] },
  { name: 'Documents & money', icon: FileText, items: ['Identification and document copies', 'Emergency contact numbers', 'Cash and payment cards', 'Medication information'] },
  { name: 'Your household', icon: Users, items: ['Baby supplies', 'Pet supplies', 'Disability or accessibility requirements', 'Other essential personal requirements'] },
];

export const Route = createFileRoute('/preparedness')({
  validateSearch: (s: Record<string, unknown>): { region: PreparednessRegion; q: string } => ({
    region: (PREPAREDNESS_REGIONS as readonly string[]).includes(String(s['region'])) ? s['region'] as PreparednessRegion : 'all',
    q: typeof s['q'] === 'string' ? s['q'].slice(0, 200) : '',
  }),
  head: () => ({ meta: [
    { title: 'UK Emergency Preparedness — 72-hour household essentials | UKStats' },
    { name: 'description', content: 'Prepare your household for three days with independent UKStats guidance, a free checklist overview and proposed equipment kits. Based on official UK Be Ready advice.' },
    { property: 'og:title', content: 'Emergency Preparedness | UKStats' },
    { property: 'og:description', content: 'Be prepared. Stay informed. Look after your household. Practical essentials and direct links to official UK Government guidance.' },
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
    <main id="main-content">
      <section className="relative isolate overflow-hidden bg-dedication text-dedication-foreground">
        <img src={householdImage} alt="Everyday household preparedness supplies arranged on a kitchen table" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 size-full object-cover object-right" />
        <div className="preparedness-hero-wash absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <p className="flex items-center gap-2 font-mono text-xs uppercase"><ShieldCheck className="size-4" aria-hidden="true" />UKStats · Emergency Preparedness</p>
          <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">Is your household prepared for 72 hours?</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-dedication-muted sm:text-lg">The UK Government’s Be Ready campaign encourages being ready for three days. Start with what you already have, make a simple plan and look after the people who depend on you.</p>
          <div className="mt-7 flex max-w-lg flex-wrap gap-3">
            <Button asChild variant="dedication" size="lg"><a href="#preparedness-kits">Explore Preparedness Kits<ArrowRight /></a></Button>
            <Button asChild variant="dedicationOutline" size="lg"><a href="#household-checklist"><ClipboardCheck />View the Free Checklist</a></Button>
          </div>
          <p className="mt-7 max-w-md text-sm font-medium">Be prepared. Stay informed. Look after your household.</p>
        </div>
      </section>
      <div className="border-b border-night-line bg-night-panel">
        <div className="mx-auto grid max-w-[1200px] gap-3 px-4 py-5 text-sm sm:grid-cols-3 sm:px-6">
          {['Official guidance, clearly sourced', 'Check what you already own', 'Free information for every household'].map(text => <p key={text} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-fresh" aria-hidden="true" />{text}</p>)}
        </div>
      </div>
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.3fr]">
        <div><p className="font-mono text-xs uppercase text-electric-soft">Start with the source</p><h2 className="mt-3 text-3xl font-semibold">Official advice.<br />Practical preparation.</h2></div>
        <div>
          <p className="text-base leading-relaxed text-night-muted">Be Ready explains how small, practical steps can help during a disruption to everyday services. Plan for three days, check your cupboards and build up supplies gradually — there is no need to buy everything at once.</p>
          <Button asChild variant="outline" className="mt-5 h-auto whitespace-normal text-left"><a href="https://beready.campaign.gov.uk/be-ready-for-emergencies/" target="_blank" rel="noopener noreferrer">Read the Official UK Government Guidance<ExternalLink /></a></Button>
          <p className="mt-4 text-xs leading-relaxed text-night-muted">This is an original UKStats summary of the Be Ready guidance, checked {fmtDate(PREPAREDNESS_CHECKED)}. UKStats is independent and is not affiliated with or endorsed by the UK Government. This is general preparedness advice, not a warning of an imminent emergency.</p>
        </div>
      </section>
      <section id="preparedness-kits" className="border-y border-night-line bg-night-panel/40">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <p className="font-mono text-xs uppercase text-electric-soft">Equipment essentials</p>
          <h2 className="mt-3 text-3xl font-semibold">A starting point for your household</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-night-muted">Three proposed equipment packages, with clear contents and no claims of complete 72-hour self-sufficiency. Plan food, drinking water and personal needs separately.</p>
          <p className="mt-4 border-l-2 border-night-line pl-4 text-sm text-night-muted">Prices and contents are provisional. Purchasing is unavailable during the current legal hold and until supplier arrangements are confirmed.</p>
          <div className="mt-8 grid items-start gap-5 md:grid-cols-3">{PREPAREDNESS_PRODUCTS.map((p, i) => <PreparednessKitCard key={p.id} product={p} image={KIT_IMAGES[i] ?? essentialImage} />)}</div>
        </div>
      </section>
      <section id="household-checklist" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase text-electric-soft">Your free starting checklist</p>
        <h2 className="mt-3 text-3xl font-semibold">Check your home before you shop</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-night-muted">You may already have many of the essentials. Use these categories to review your supplies and make a list that works for your household.</p>
        <div className="mt-7 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">{CHECKLIST_GROUPS.map(g => <details key={g.name} className="border-b border-night-line py-3"><summary className="flex min-h-11 cursor-pointer items-center gap-3 font-medium focus-visible:outline-2 focus-visible:outline-electric"><g.icon className="size-5 text-electric-soft" aria-hidden="true" />{g.name}<span className="ml-auto text-night-muted" aria-hidden="true">+</span></summary><ul className="ml-8 list-disc space-y-2 pb-3 pt-2 text-sm text-night-muted">{g.items.map(item => <li key={item}>{item}</li>)}</ul></details>)}</div>
        <p className="mt-5 text-xs text-night-muted">An independent UKStats checklist overview based on Be Ready guidance, not an official government document.</p>
        <div className="mt-8 flex items-start gap-4 border-y border-night-line py-6"><Droplets className="mt-1 size-7 shrink-0 text-electric-soft" aria-hidden="true" /><div><h3 className="text-xl font-semibold">Remember food and drinking water</h3><p className="mt-2 max-w-3xl leading-relaxed text-night-muted">Be Ready advises 3 litres of drinking water per person per day for three days. More is needed for cooking, washing and other needs. Choose non-perishable food that suits your diet, including options that do not need refrigeration or cooking, and consider babies, pets and medical needs.</p><Button asChild variant="link" className="mt-2 px-0"><a href="https://beready.campaign.gov.uk/be-ready-for-emergencies/" target="_blank" rel="noopener noreferrer">Read the official food and water advice<ExternalLink /></a></Button></div></div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6" aria-label="International official preparedness advice">
      <p className="font-mono text-xs uppercase text-electric-soft">Around the world</p>
      <h2 className="mt-3 text-3xl font-semibold">Government advice by country</h2>
      <p className="mt-3 max-w-3xl text-base text-night-muted">Advice differs by country. These excerpts retain each government’s original wording, with direct official links.</p>
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
      <p className="mt-6 text-xs text-night-muted">These are official recommendations, not statistics. Country excerpts above are verbatim. New Zealand’s litres figure is derived from its stated nine litres for three days.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
