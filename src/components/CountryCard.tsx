import type { CountryMetric } from '@/lib/countries';
import { ageLabel, fmtDate } from '@/lib/uk-stats';
import { periodEnd } from '@/lib/country-detail';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { ChartNoAxesCombined, BookOpen } from 'lucide-react';
export function CountryCard({ m, country, embedded = false }: { m: CountryMetric; country?: string; embedded?: boolean }) {
  const max = Math.max(...m.spark), min = Math.min(...m.spark); const end = periodEnd(m.period);
  return <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-night-line bg-night-panel p-4">
    <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-medium text-night-muted">{m.title}</h3><span className={`shrink-0 font-mono text-[10px] ${m.value !== null ? 'text-fresh' : 'text-ageing'}`}>{m.value !== null ? 'SOURCED' : m.status === 'unavailable' ? 'UNAVAILABLE' : 'NO LIVE FEED'}</span></div>
    <p className={`break-words font-mono font-semibold ${m.value !== null ? 'text-2xl text-night-fg' : 'text-lg text-night-muted'}`}>{m.value ?? 'No live feed'}</p>
    {m.spark.length > 1 && <svg viewBox={`0 0 ${m.spark.length - 1} 20`} className="h-8 w-full text-electric" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={m.spark.map((v,i) => `${i},${max === min ? 10 : 20 - ((v-min)/(max-min))*20}`).join(' ')} /></svg>}
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-mono text-xs text-night-muted">
      <dt>Period</dt><dd className="break-words text-night-fg">{m.period ?? 'Not available'}</dd>
      <dt>Data age</dt><dd className="text-night-fg">{end ? `${ageLabel(end)} · period end` : 'Unknown'}</dd>
      <dt>Source updated</dt><dd className="text-night-fg">{m.asOf ? `${fmtDate(m.asOf)} · ${ageLabel(m.asOf)}` : 'Date not supplied by feed'}</dd>
      <dt>Cadence</dt><dd className="text-night-fg">{m.cadence}</dd>
      <dt>Next release</dt><dd className="text-night-fg">{m.next ?? 'Date not confirmed · Eurostat calendar'}</dd>
    </dl>
    {m.note && <p className="text-xs leading-relaxed text-night-muted">{m.note}</p>}
    <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-auto break-words text-xs text-electric-soft underline">Source: {m.source}</a>
    {country && !embedded && <div className="flex flex-wrap gap-1 border-t border-night-line pt-2"><Button asChild variant="ghost" size="sm"><Link to="/$country/explained/$metricId" params={{ country, metricId: m.id }}><BookOpen />Explained</Link></Button><Button asChild variant="ghost" size="sm"><Link to="/$country/history/$metricId" params={{ country, metricId: m.id }}><ChartNoAxesCombined />History</Link></Button></div>}
  </article>;
}
