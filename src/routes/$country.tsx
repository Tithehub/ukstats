import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { countryByCode } from '@/lib/countries';
export const Route = createFileRoute('/$country')({
  beforeLoad: ({ params }) => { if (!countryByCode(params.country)) throw notFound(); },
  head: ({ params }) => {
    const name = countryByCode(params.country)?.name ?? 'Country';
    return { meta: [{ title: `${name} official statistics — UKStats` }, { name: 'description', content: `Official ${name} statistics and publisher links.` }, { property: 'og:title', content: `${name} official statistics — UKStats` }, { property: 'og:description', content: `Official ${name} figures, sourced and dated.` }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
  },
  component: () => <Outlet />,
  notFoundComponent: () => <main className="p-8 text-night-fg">Country not found.</main>,
});
