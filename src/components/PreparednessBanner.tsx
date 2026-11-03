import { Link } from '@tanstack/react-router';
import { ArrowRight, ClipboardCheck, ExternalLink, LifeBuoy, PackageCheck, ShieldCheck, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREPAREDNESS_CHECKED } from '@/lib/preparedness.data';
import { fmtDate } from '@/lib/uk-stats';
import householdImage from '@/assets/preparedness-household.jpg';

// Home-page banner for the Emergency Preparedness service: links to every
// relevant part of /preparedness plus the official Be Ready source. Purchasing
// stays paused under the legal hold, so kits are presented as proposed only.
export function PreparednessBanner({ className = '' }: { className?: string }) {
  return (
    <section aria-label="Emergency preparedness" className={`relative isolate overflow-hidden rounded-md border border-night-line bg-dedication text-dedication-foreground ${className}`}>
      <img src={householdImage} alt="" loading="lazy" width={1536} height={1024} className="absolute inset-0 -z-20 size-full object-cover object-right opacity-60" />
      <div className="preparedness-hero-wash absolute inset-0 -z-10" />
      <div className="grid gap-6 px-5 py-7 sm:px-7 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase"><LifeBuoy className="size-4" aria-hidden="true" />Emergency Preparedness</p>
          <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight sm:text-3xl">Is your household prepared for 72 hours?</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-dedication-muted">The UK Government’s Be Ready campaign encourages being ready for three days. Free checklist, proposed equipment kits and official advice from six governments — all in one place.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="dedication"><Link to="/preparedness" search={{ region: "all", q: "" }}>Explore preparedness<ArrowRight /></Link></Button>
            <Button asChild variant="dedicationOutline"><a href="https://beready.campaign.gov.uk/be-ready-for-emergencies/" target="_blank" rel="noopener noreferrer">Official Be Ready guidance<ExternalLink /></a></Button>
          </div>
          <p className="mt-4 text-xs text-dedication-muted">Independent UKStats guidance based on official sources, checked {fmtDate(PREPAREDNESS_CHECKED)}. Not a warning of an imminent emergency.</p>
        </div>
        <nav aria-label="Preparedness sections" className="grid gap-2 text-sm">
          <Link to="/preparedness" search={{ region: "all", q: "" }} hash="preparedness-kits" className="flex min-h-11 items-center gap-3 rounded-md border border-dedication-foreground/20 bg-dedication-foreground/5 px-4 py-2 hover:bg-dedication-foreground/10">
            <PackageCheck className="size-4 shrink-0" aria-hidden="true" />Proposed equipment kits — from £59.99, provisional
          </Link>
          <Link to="/preparedness" search={{ region: "all", q: "" }} hash="household-checklist" className="flex min-h-11 items-center gap-3 rounded-md border border-dedication-foreground/20 bg-dedication-foreground/5 px-4 py-2 hover:bg-dedication-foreground/10">
            <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" />Free household checklist — check what you already own
          </Link>
          <Link to="/preparedness" className="flex min-h-11 items-center gap-3 rounded-md border border-dedication-foreground/20 bg-dedication-foreground/5 px-4 py-2 hover:bg-dedication-foreground/10">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />Official UK advice — 3 litres of water per person per day
          </Link>
          <Link to="/preparedness" className="flex min-h-11 items-center gap-3 rounded-md border border-dedication-foreground/20 bg-dedication-foreground/5 px-4 py-2 hover:bg-dedication-foreground/10">
            <Globe2 className="size-4 shrink-0" aria-hidden="true" />Government advice by country — UK, US, Canada and more
          </Link>
        </nav>
      </div>
    </section>
  );
}
