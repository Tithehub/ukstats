import { Users, PackageCheck } from 'lucide-react';
import type { PreparednessProduct } from '@/lib/preparedness-products';

export function PreparednessKitCard({ product, image }: { product: PreparednessProduct; image: string }) {
  return <article className="flex flex-col overflow-hidden rounded-md border border-night-line bg-night-panel">
    <img src={image} alt={`${product.name}: illustrative proposed equipment, not confirmed supplier contents`} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase text-night-muted">Proposed package · not available to order</p>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">{product.name}</h3>
        <p className="text-2xl font-semibold">£{(product.pricePence / 100).toFixed(2)}</p>
      </div>
      <p className="mt-1 text-xs text-night-muted">Provisional price</p>
      <p className="mt-4 min-h-16 text-sm leading-relaxed text-night-muted">{product.description}</p>
      <p className="mt-3 flex items-center gap-2 text-sm"><Users className="size-4 text-electric-soft" aria-hidden="true" />Designed for {product.householdSize} {product.householdSize === 1 ? 'person' : 'people'}</p>
      <ul className="mt-4 space-y-2 text-sm">{product.contents.slice(0, 3).map(item => <li key={item} className="flex items-start gap-2"><PackageCheck className="mt-0.5 size-4 shrink-0 text-fresh" aria-hidden="true" />{item}</li>)}</ul>
      <p className="mt-5 border-t border-night-line pt-4 text-xs leading-relaxed text-night-muted">Equipment only. Food, drinking water, medication and individual household needs are not included. Images are illustrative, not supplier photographs.</p>
      <details className="mt-5 border-t border-night-line pt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-electric">View proposed contents</summary>
        <ul className="ml-5 list-disc space-y-2 py-3 text-sm text-night-muted">{product.contents.map(item => <li key={item}>{item}</li>)}</ul>
        <p className="text-xs leading-relaxed text-night-muted">Exact contents, specifications, delivery, returns and warranty information await supplier confirmation. No stock or fulfilment service is confirmed.</p>
      </details>
    </div>
  </article>;
}