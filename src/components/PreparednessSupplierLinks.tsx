import { ExternalLink, Backpack, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREPAREDNESS_SUPPLIERS, SUPPLIER_LINKS_CHECKED } from '@/lib/preparedness-suppliers';
import { fmtDate } from '@/lib/uk-stats';

export function PreparednessSupplierLinks() {
  return <section id="preparedness-kits" className="border-y border-night-line bg-night-panel/40" aria-labelledby="supplier-kits-heading">
    <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase text-electric-soft">Direct supplier links · no commission</p>
      <h2 id="supplier-kits-heading" className="mt-3 text-3xl font-semibold">Emergency evacuation & supply kits</h2>
      <p className="mt-4 max-w-3xl leading-relaxed text-night-muted">If a ready-packed bag would help, these supplier pages list evacuation essentials. We checked their descriptions for lighting, first aid and warmth against the needs in official preparedness guidance. They are options to compare, not a ranking of the “best” kits.</p>
      <div className="mt-6 border-y-2 border-electric py-5" role="note" aria-label="Independent supplier link notice">
        <p className="text-lg font-semibold">UKStats makes no money from these links. We do not endorse these kits or suppliers.</p>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-night-muted">No affiliate links, commission, referral fees or paid placements. We have not tested these products and do not guarantee their quality, safety, suitability, stock or delivery. Any purchase is directly with the supplier, under their terms — not through UKStats. UKStats payments and donations remain paused.</p>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-night-muted">Supplier pages checked {fmtDate(SUPPLIER_LINKS_CHECKED)}. Contents below summarise supplier descriptions, not independent product tests. Confirm current contents, price including VAT, availability, delivery, returns and suitability on the supplier’s page before buying.</p>
      <div className="mt-7 grid items-stretch gap-5 md:grid-cols-3">
        {PREPAREDNESS_SUPPLIERS.map(kit => <article key={kit.id} className="flex min-w-0 flex-col rounded-md border border-night-line bg-night-panel p-5 sm:p-6">
          <Backpack className="size-8 text-electric-soft" aria-hidden="true" />
          <p className="mt-4 font-mono text-[11px] uppercase text-night-muted">{kit.category}</p>
          <h3 className="mt-2 text-xl font-semibold">{kit.name}</h3>
          <p className="mt-2 text-sm text-night-muted">Sold by {kit.supplier}</p>
          <ul className="mt-5 space-y-3 text-sm">{kit.contents.map(item => <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-fresh" aria-hidden="true" /><span>{item}</span></li>)}</ul>
          <p className="mb-6 mt-5 border-t border-night-line pt-4 text-sm leading-relaxed text-night-muted">{kit.limitations}</p>
          <Button asChild variant="outline" className="mt-auto h-auto min-h-11 w-full whitespace-normal py-3"><a href={kit.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${kit.name} at ${kit.supplier}`}>View at {kit.supplier}<ExternalLink className="shrink-0" /></a></Button>
        </article>)}
      </div>
      <p className="mt-6 max-w-4xl text-sm leading-relaxed text-night-muted">No ready-packed kit replaces your own plan. Be Ready advises 3 litres of drinking water per person per day for three days, plus additional water for cooking and hygiene. Include essential medication, documents and household-specific needs. Follow local emergency instructions; do not delay an evacuation to shop or collect supplies.</p>
      <Button asChild variant="link" className="mt-3 h-auto whitespace-normal px-0 text-left"><a href="https://beready.campaign.gov.uk/be-ready-for-emergencies/" target="_blank" rel="noopener noreferrer">Compare with official Be Ready guidance<ExternalLink className="shrink-0" /></a></Button>
    </div>
  </section>;
}