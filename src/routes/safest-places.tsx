import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CRIME_COVERAGE, CRIME_COUNTRIES } from '@/lib/city-crime';
import { cityCrimeQuery } from '@/lib/city-crime.functions';
import { CityCrimeRankings } from '@/components/CityCrimeRankings';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageLoadError, PageNotFound } from '@/components/layout/PageFeedback';
export const Route=createFileRoute('/safest-places')({
 validateSearch:(s:Record<string,unknown>)=>({country:typeof s['country']==='string' && CRIME_COUNTRIES.some(c=>c.code===s['country'])?s['country']:'uk'}),
 loaderDeps:({search})=>({code:search.country}),
 loader:({context,deps})=>context.queryClient.ensureQueryData(cityCrimeQuery(deps.code)),
 head:()=>({meta:[{title:'Safest places? Official city crime rankings — UKStats'},{name:'description',content:'Ten lowest and highest recorded-crime city areas where comparable official data is available. Sources, dates and coverage limitations included.'},{property:'og:title',content:'Official city crime rankings — UKStats'},{property:'og:description',content:'Compare recorded crime within a country, with official sources and honest coverage gaps.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Page,errorComponent:PageLoadError,notFoundComponent:PageNotFound,
});
function Page(){const {country}=Route.useSearch();const navigate=useNavigate({from:'/safest-places'});return <div className="min-h-screen bg-night text-night-fg"><SiteHeader/><main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Where is recorded crime lowest?</h1><p className="mt-3 text-sm text-night-muted">Official town and city comparisons · no safety scores invented.</p><div className="mt-6 flex flex-wrap items-center gap-3"><label htmlFor="crime-country" className="text-sm">Country</label><select id="crime-country" value={country} onChange={e=>void navigate({search:{country:e.target.value}})} className="min-h-11 max-w-full rounded-md border border-input bg-background px-3 text-foreground">{CRIME_COUNTRIES.map(c=><option value="">{c.name}</option>)}</select></div><CityCrimeRankings code={country}/></main><SiteFooter/></div>;}