import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { SiteHeader } from './layout/SiteHeader';
import { SiteFooter } from './layout/SiteFooter';
import type { Country } from '@/lib/countries';
import { Button } from './ui/button';
import { Banner } from './Banner';
import { countryImage } from '@/lib/country-images';
export function CountryShell({ country, children }: { country: Country; children: ReactNode }) {
  return <div className="min-h-screen bg-night text-night-fg"><SiteHeader /><main className="mx-auto max-w-6xl px-4 py-8">
    <Banner {...countryImage(country.code)} eager />
    <Link to="/countries" className="text-sm text-electric-soft">← Countries</Link>
    <h1 className="mt-3 text-4xl font-semibold break-words">{country.name}</h1>
    <nav aria-label={`${country.name} statistics`} className="mt-5 flex flex-wrap gap-2 border-b border-night-line pb-5">
      <Button asChild variant="outline" size="sm"><Link to="/$country" params={{ country: country.code }}>Register</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/$country/calendar" params={{ country: country.code }}>Releases</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/$country/status" params={{ country: country.code }}>Feed health</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/$country/sources" params={{ country: country.code }}>Sources</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/compare-countries" search={{ metric: 'hicp' }}>Compare</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/online-speech">Online speech</Link></Button>
    </nav>{children}</main><SiteFooter /></div>;
}
