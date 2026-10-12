import { createFileRoute } from '@tanstack/react-router';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
export const Route = createFileRoute('/$country/sources')({
 loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
 head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Official sources', 'Official sources for official country statistics, with publisher links and transparent availability.'),
 component: Page,
  errorComponent: () => <main className="p-8">Country data unavailable. Please try again.</main>,
 notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function Page() {
 const { country } = Route.useParams();
 const data = Route.useLoaderData();
 if (!data) return null;
 const reg = countryByCode(country);
 const offices: { name: string; url: string }[] = reg
   ? [{ name: reg.office, url: reg.officeUrl }, ...(reg.agencies ?? [])]
   : [];
 return (
   <CountryShell country={data.country}>
     <h2 className="mt-6 text-2xl font-semibold">Official sources</h2>
     {offices.length > 0 && (
       <section className="mt-6">
         <h3 className="text-sm font-medium">National statistics {offices.length > 1 ? 'offices' : 'office'}</h3>
         <ul className="mt-2 space-y-1">
           {offices.map((o) => (
             <li key={o.url}>
               <a href={o.url} target="_blank" rel="noreferrer" className="break-words text-sm text-electric-soft underline">{o.name}</a>
             </li>
           ))}
         </ul>
       </section>
     )}
     <section className="mt-6">
       <h3 className="text-sm font-medium">Compare across countries</h3>
       <ul className="mt-2 space-y-1">
         {reg?.eurostat && (
           <li><a href="https://ec.europa.eu/eurostat" target="_blank" rel="noreferrer" className="break-words text-sm text-electric-soft underline">Eurostat</a></li>
         )}
         <li><a href="https://data.oecd.org" target="_blank" rel="noreferrer" className="break-words text-sm text-electric-soft underline">OECD Data</a></li>
         {reg?.euro && (
           <li><a href="https://www.ecb.europa.eu" target="_blank" rel="noreferrer" className="break-words text-sm text-electric-soft underline">European Central Bank</a></li>
         )}
       </ul>
     </section>
     <div className="mt-6 divide-y divide-night-line">{data.metrics.map(m => <div key={m.id} className="py-4"><h3 className="text-sm font-medium">{m.title}</h3><a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm text-electric-soft underline">{m.source}</a><p className="mt-1 text-xs text-night-muted">{m.cadence} · {m.period ?? 'No period available'}</p></div>)}</div>
   </CountryShell>
 );
}
