import { useSuspenseQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';
import { cityCrimeQuery } from '@/lib/city-crime.functions';
import { cityTopTens, type CityCrimeRow } from '@/lib/city-crime';
import { ClockText } from './ClockText';
import { fmtDate } from '@/lib/uk-stats';
export function CityCrimeRankings({code}:{code:string}) {
 const {data} = useSuspenseQuery(cityCrimeQuery(code));
 const lists = cityTopTens(data.rows);
 return <section className="mt-6 min-w-0">
  <h2 className="text-2xl font-semibold">City crime rankings</h2>
  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-night-muted">Lower recorded crime is not a guarantee of safety. Reporting, policing and city boundaries affect these figures. Rankings compare only the same measure and year within one country.</p>
  <dl className="mt-5 grid gap-x-8 gap-y-4 border-y border-night-line py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
   <div><dt className="text-night-muted">Measure</dt><dd className="mt-1">{data.metric}{data.unit ? <span className="mt-1 block text-xs text-night-muted">{data.unit}</span>:null}</dd></div>
   <div><dt className="text-night-muted">Reference period</dt><dd className="mt-1">{data.period ?? 'Not available'}</dd></div>
   <div><dt className="text-night-muted">Published / age</dt><dd className="mt-1">{data.published ? <>{fmtDate(data.published)}<ClockText as="span" className="mt-1 block text-xs text-night-muted" render={()=>`${Math.max(0,Math.floor((Date.now()-Date.parse(data.published ?? ''))/86_400_000))} days since publication`} /></>:'Not available'}</dd></div>
   <div><dt className="text-night-muted">Next release</dt><dd className="mt-1">{data.next}</dd></div>
  </dl>
  <p className="mt-4 text-sm text-night-muted">{data.geography}{data.rows.length ? ` · ${data.rows.length} city areas in the published table` : ''}</p>
  <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-electric-soft underline">{data.source}<ExternalLink className="size-4 shrink-0" aria-hidden="true" /></a>
  {data.reason ? <div className="mt-6 border-l-2 border-ageing py-2 pl-4"><h3 className="font-semibold">Ranking unavailable</h3><p className="mt-2 max-w-3xl text-sm leading-relaxed text-night-muted">{data.reason}</p></div> : <>
   <p className="mt-4 max-w-3xl text-sm text-night-muted">The Crime Severity Index weights police-recorded offences by their seriousness and adjusts for population. It is an index, not a count of crimes per 100,000. These are metropolitan areas, not individual neighbourhoods or every town in Canada.</p>
   <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-2"><Ranking title="10 lowest recorded crime" rows={lists.lowest} lower /><Ranking title="10 highest recorded crime" rows={lists.highest} /></div>
   <p className="mt-5 text-xs leading-relaxed text-night-muted">Equal values are ties, not differences in safety. Source notes describe local reporting and boundary differences. No cross-country league table is implied.</p>
  </>}
 </section>;
}
function Ranking({title,rows,lower=false}:{title:string;rows:CityCrimeRow[];lower?:boolean}) {
 const Icon=lower?ShieldCheck:ShieldAlert;
 return <section className="min-w-0"><h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Icon className={`size-5 shrink-0 ${lower?'text-fresh':'text-overdue'}`} />{title}</h3><table className="w-full table-fixed text-sm"><thead><tr className="border-b border-night-line text-left text-xs text-night-muted"><th className="w-10 py-3">No.</th><th className="py-3">City area</th><th className="w-20 py-3 text-right">Index</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.code} className="border-b border-night-line"><td className="py-4 align-top font-mono text-night-muted">{i+1}</td><th scope="row" className="break-words py-4 pr-3 text-left font-medium">{r.name}</th><td className="py-4 text-right align-top font-mono">{r.value.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>)}</tbody></table></section>;
}