import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CRIME_COVERAGE, CRIME_COUNTRIES } from '@/lib/city-crime';
import { cityCrimeQuery } from '@/lib/city-crime.functions';
import { CityCrimeRankings } from '@/components/CityCrimeRankings';
import { RestoreSignupCta } from '@/components/RestoreSignupCta';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageLoadError, PageNotFound } from '@/components/layout/PageFeedback';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
export const Route=createFileRoute('/safest-places')({
 validateSearch:(s:Record<string,unknown>)=>({country:typeof s['country']==='string' && CRIME_COUNTRIES.some(c=>c.code===s['country'])?s['country']:'uk'}),
 loaderDeps:({search})=>({code:search.country}),
 loader:({context,deps})=>context.queryClient.ensureQueryData(cityCrimeQuery(deps.code)),
 head:()=>({meta:[{title:'Safest places? Official city crime rankings — UKStats'},{name:'description',content:'Ten lowest and highest recorded-crime city areas where comparable official data is available. Sources, dates and coverage limitations included.'},{property:'og:title',content:'Official city crime rankings — UKStats'},{property:'og:description',content:'Compare recorded crime within a country, with official sources and honest coverage gaps.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Page,errorComponent:PageLoadError,notFoundComponent:PageNotFound,
});
function Page(){const {country}=Route.useSearch();const navigate=useNavigate({from:'/safest-places'});const covered=new Set(CRIME_COVERAGE);const coverage=CRIME_COVERAGE.map(c=>CRIME_COUNTRIES.find(x=>x.code===c)?.name).filter(Boolean).join(', ');return <div className="min-h-screen bg-night text-night-fg"><SiteHeader/><main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Where is recorded crime lowest?</h1><p className="mt-3 text-sm text-night-muted">Official town and city comparisons · no safety scores invented.</p><p className="mt-2 text-sm text-night-muted">Rankings are currently available for {coverage}. Every other country shows why no honest ranking can be given — regional totals and perception surveys are never substituted.</p><nav aria-label="Choose a country" className="mt-6"><h2 className="font-mono text-[11px] tracking-wide text-night-muted uppercase">Pick a country</h2><div className="mt-3 flex flex-wrap gap-2">{CRIME_COUNTRIES.map(c=>{const active=c.code===country;const has=covered.has(c.code);return <Button key={c.code} size="sm" variant={active?'default':'outline'} aria-pressed={active} onClick={()=>void navigate({search:{country:c.code}})} className={has?'':'text-night-muted'}>{has&&<ShieldCheck aria-hidden="true" className="size-3.5" />}{c.name}</Button>;})}</div><p className="mt-2 font-mono text-[11px] text-night-muted">Countries marked with a shield have live official rankings. The rest explain why no honest ranking exists yet.</p></nav><RestoreSignupCta/><CityCrimeRankings code={country}/></main><SiteFooter/></div>;}