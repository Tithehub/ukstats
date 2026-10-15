import { Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/restore-britain-logo.png.asset.json";

/** Independent dedication, never a paid sponsor placement. */
export function RestoreDedication() {
  return (
    <section aria-labelledby="restore-dedication-title" className="border-t border-night-line bg-dedication text-dedication-foreground">
      <div className="mx-auto grid max-w-[1280px] items-start gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-12">
        <img src={logoAsset.url} alt="Restore Britain" width={589} height={263} loading="lazy" className="h-auto w-full max-w-[260px]" />
        <div className="min-w-0">
          <h2 id="restore-dedication-title" className="text-xl font-semibold leading-snug text-balance sm:text-2xl">For Rupert Lowe, the Restore Britain team, and the people</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed">
            UKStats was built independently as a free resource for Rupert Lowe, the Restore Britain team, and the public. Access to the statistics is free of charge. Funding comes from voluntary donations and clearly labelled business sponsorships, giving local businesses a place to share their details and supporting their visibility and growth.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="dedication"><Link to="/advertise">Sponsor your local business<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild variant="dedicationOutline"><Link to="/support"><HeartHandshake aria-hidden="true" />Donate</Link></Button>
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-dedication-muted">This is an independent dedication, not an official Restore Britain service or a claim of endorsement. Sponsors have no influence over the figures.</p>
        </div>
      </div>
    </section>
  );
}