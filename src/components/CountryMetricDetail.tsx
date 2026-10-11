import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { CountryCard } from './CountryCard';
import type { Country, CountryMetric } from '@/lib/countries';
import { downloadText, observationsCsv } from '@/lib/country-detail';
import { ES_DEFS } from '@/lib/eurostat';
import { Copy, Download, Code } from 'lucide-react';
export function CountryMetricDetail({ country, metric: m, history = false }: { country: Country; metric: CountryMetric; history?: boolean }) {
  const [copied, setCopied] = useState(''); const [range, setRange] = useState('Max');
  const all = m.history ?? [];
  const last = all.at(-1); const years = range === '1Y' ? 1 : range === '5Y' ? 5 : range === '10Y' ? 10 : null;
  const points = years && last ? all.filter(p => Number(p.time.slice(0,4)) > Number(last.time.slice(0,4)) - years) : all;
  const vals = points.map(p => p.value), min = Math.min(...vals), max = Math.max(...vals), span = max-min || 1;
  async function copy(kind: string) {
    try {
      const url = `${window.location.origin}/${country.code}/explained/${m.id}`;
      const text = kind === 'Embed' ? `<iframe src="${window.location.origin}/${country.code}/embed/${m.id}" title="${m.title.replace(/"/g, '')}" width="400" height="520" style="border:0" loading="lazy"></iframe>` : `${m.title}: ${m.value ?? 'No live feed'} (${m.period ?? 'period unavailable'}). Source: ${m.source}, ${m.sourceUrl}. UKStats: ${url}`;
      await navigator.clipboard.writeText(text); setCopied(kind);
    } catch { setCopied('Copy unavailable'); }
  }
  const def = ES_DEFS.find(d => d.id === m.id);
  return <div className="py-6"><h2 className="text-2xl font-semibold">{m.title}{history ? ' — published history' : ' — explained'}</h2>
    <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => copy('Citation')}><Copy />{copied === 'Citation' ? 'Copied' : 'Cite'}</Button><Button variant="outline" size="sm" onClick={() => copy('Embed')}><Code />{copied === 'Embed' ? 'Copied' : 'Embed'}</Button><Button variant="outline" size="sm" disabled={!all.length} onClick={() => downloadText(observationsCsv(m), `${country.code}-${m.id}.csv`)}><Download />CSV</Button><Button asChild variant="ghost" size="sm"><Link to={history ? '/$country/explained/$metricId' : '/$country/history/$metricId'} params={{ country: country.code, metricId: m.id }}>{history ? 'Explained' : 'Full history'}</Link></Button></div>
    {copied === 'Copy unavailable' && <p role="status" className="mt-2 text-sm text-ageing">Your browser could not copy this item.</p>}
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"><div>
      {history ? <><div className="mb-4 flex flex-wrap gap-1">{['1Y','5Y','10Y','Max'].map(r => <Button key={r} size="sm" variant={range === r ? 'default' : 'ghost'} aria-pressed={range === r} onClick={() => setRange(r)}>{r}</Button>)}</div>
        {points.length > 1 ? <svg viewBox="0 0 720 260" role="img" aria-label={`${m.title}, ${points.length} published observations`} className="w-full"><line x1="50" y1="225" x2="710" y2="225" stroke="var(--night-line)" /><polyline fill="none" stroke="var(--electric)" strokeWidth="2" points={points.map((p,i) => `${50+i/(points.length-1)*660},${20+(1-(p.value-min)/span)*190}`).join(' ')} />{[min,max].map((v,i) => <text key={i} x="5" y={i === 0 ? 220 : 20} className="fill-night-muted text-[11px]">{v.toLocaleString('en-GB', { maximumFractionDigits: 1 })}</text>)}<text x="50" y="250" className="fill-night-muted text-[11px]">{points[0]?.time}</text><text x="710" y="250" textAnchor="end" className="fill-night-muted text-[11px]">{points.at(-1)?.time}</text></svg> : <p className="text-night-muted">Not enough published observations for a chart.</p>}
        <p className="mt-3 font-mono text-xs text-night-muted">{all.length} observations retrieved · {def ? 'Full available Eurostat series' : 'Available observations from the connected national feed; not necessarily the full archive'}</p>
        <div className="mt-6 max-h-96 overflow-auto"><table className="w-full text-left font-mono text-xs"><thead><tr className="border-b border-night-line"><th className="py-2">Period</th><th className="py-2 text-right">Published value</th></tr></thead><tbody>{[...points].reverse().map(p => <tr key={p.time} className="border-b border-night-line"><td className="py-2">{p.time}</td><td className="py-2 text-right">{p.formatted}</td></tr>)}</tbody></table></div>
      </> : <div className="space-y-7 text-sm leading-relaxed text-night-muted"><section><h3 className="mb-2 text-lg text-night-fg">What this measures</h3><p>{m.title}. {m.note ?? 'Use the publisher’s methodology for the exact statistical scope and definition.'}</p></section><section><h3 className="mb-2 text-lg text-night-fg">Who publishes it</h3><p>{m.source}. {def ? `Dataset ${def.dataset}; the selected series uses ${Object.entries(def.params).map(([k,v]) => `${k}=${v}`).join(', ') || 'the dataset’s single published series'}.` : 'This figure comes from the linked national publisher, not a UK figure transferred to another country.'}</p></section><section><h3 className="mb-2 text-lg text-night-fg">How to read it</h3><p>The reference period is {m.period ?? 'not available'}. Publication age and the period covered are different; a recent download does not make an old observation new. Blank values remain blank.</p></section><section><h3 className="mb-2 text-lg text-night-fg">Comparability and limitations</h3><p>{/irregular|asylum|border|returned|ordered/.test(m.id) ? 'Asylum claims, encounters, detected illegal presence, orders to leave and returns measure different events. None is a count of everyone living irregularly in the country; categories cannot be added together to estimate a population.' : 'Match the unit, definition, coverage and reference period before comparing countries. Official sources may revise earlier observations.'}</p></section></div>}
    </div><CountryCard m={m} /></div>
  </div>;
}
