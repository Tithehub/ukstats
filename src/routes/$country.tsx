import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { countryByCode } from '@/lib/countries';
export const Route = createFileRoute('/$country')({
  beforeLoad: ({ params }) => { if (!countryByCode(params.country)) throw notFound(); },
  component: () => <Outlet />,
  notFoundComponent: () => <main className="p-8 text-night-fg">Country not found.</main>,
});
