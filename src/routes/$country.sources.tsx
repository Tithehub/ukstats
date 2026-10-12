import { createFileRoute, Link } from '@tanstack/react-router';
import { countryQuery } from '@/lib/country-queries';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { CountryShell } from '@/components/CountryShell';
import { agencyGroups, hostOf } from '@/lib/agencies';
export const Route = createFileRoute('/$country/sources')({
 loader: ({ params, context }) => context.queryClient.ensureQueryData(countryQuery(params.country)),
 head: ({ params }) => countryHead(countryByCode(params.country)?.name ?? params.country, 'Official sources', 'Every government body that publishes official figures for this country, by topic, with checked links.'),
 component: Page,
  errorComponent: () => <main className="p-8">Country data unavailable. Please try again.</main>,
 notFoundComponent: () => <main className="p-8">Country not found.</main>,
});
function Page() {
 const { country } = Route.useParams();
 const data = Route.useLoaderData();
 if (!data) return null;
 const reg = countryByCode(country);
 const liveHosts = new Set(data.metrics.filter(m => m.status === 'ok').map(m => hostOf(m.sourceUrl)));
 const isLive = (u: string) => { const h = hostOf(u); return [...liveHosts].some(l => l && (l === h || l.endsWith('.' + h) || h.endsWith('.' + l))); };
 const groups = agencyGroups(country);
 return (
   <CountryShell country={data.country}>
     <h2 className="mt-6 text-2xl font-semibold">Official sources</h2>
     <p className="mt-1 text-sm text-night-muted">The government body behind each topic. <span className="text-fresh">Live on UKStats</span> means we pull its figures now; others are linked so you can go straight to the source. <Link to="/sources" className="text-electric-soft underline">Compare all countries</Link></p>
     <div className="mt-6 grid gap-4 sm:grid-cols-2">
       {groups.map(g => (
         <section key={g.category} className="rounded-md border border-night-line bg-night-panel p-4">
           <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-night-muted">{g.label}</h3>
           {g.bodies.length ? (
             <ul className="mt-2 space-y-2">
               {g.bodies.map(b => (
                 <li key={b.url + b.name}>
                   <a href={b.url} target="_blank" rel="noreferrer" className="break-words text-sm text-electric-soft underline">{b.name}</a>
                   <span className={`ml-2 font-mono text-[10px] uppercase ${isLive(b.url) ? 'text-fresh' : 'text-night-muted'}`}>{isLive(b.url) ? 'Live on UKStats' : 'Source only'}</span>
                   <p className="text-xs text-night-muted">{b.publishes}</p>
                 </li>
               ))}
             </ul>
           ) : <p className="mt-2 text-sm text-night-muted">No verified official publisher for this topic yet.</p>}
         </section>
       ))}
     </div>
     <section className="mt-6">
       <h3 className="text-sm font-medium">Compare across countries</h3>
       <ul className="mt-2 space-y-1">
         {reg?.eurostat && <li><a href="https://ec.europa.eu/eurostat" target="_blank" rel="noreferrer" className="text-sm text-electric-soft underline">Eurostat</a></li>}
         <li><a href="https://data.oecd.org" target="_blank" rel="noreferrer" className="text-sm text-electric-soft underline">OECD Data</a></li>
         {reg?.euro && <li><a href="https://www.ecb.europa.eu" target="_blank" rel="noreferrer" className="text-sm text-electric-soft underline">European Central Bank</a></li>}
         <li><a href="https://data.imf.org" target="_blank" rel="noreferrer" className="text-sm text-electric-soft underline">IMF Data</a> (<Link to="/gold" className="underline">gold reserves</Link>)</li>
       </ul>
     </section>
     <h3 className="mt-8 text-sm font-medium">Figures shown for this country</h3>
     <div className="mt-2 divide-y divide-night-line">{data.metrics.map(m => <div key={m.id} className="py-4"><h4 className="text-sm font-medium">{m.title}</h4><a href={m.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm text-electric-soft underline">{m.source}</a><p className="mt-1 text-xs text-night-muted">{m.cadence} · {m.period ?? 'No period available'}</p></div>)}</div>
   </CountryShell>
 );
}
