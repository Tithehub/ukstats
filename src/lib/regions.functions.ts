import { createServerFn } from "@tanstack/react-start";
import { getMapLayers, getUkStats, type MapArea } from "@/lib/uk-stats.functions";
import { normPfa, regionBySlug, REGIONS, type RegionDef } from "@/lib/regions";
import type { Metric } from "@/lib/uk-stats";

export interface RegionCrimeLayer {
  id: string;
  title: string;
  unit: string;
  source: string;
  sourceUrl: string;
  period: string | null;
  asOf: string | null;
  coverage: string;
  areas: MapArea[];
}

export interface RegionDashboard {
  region: RegionDef;
  housePrice: { formatted: string; period: string | null; source: string; sourceUrl: string } | null;
  crimeLayers: RegionCrimeLayer[];
  /** Live NHS metrics (Scotland only — England has no machine-readable feed). */
  nhs: Metric[];
  /** Plain-English notes about what is not published for this region. */
  gaps: string[];
  fetchedAt: string;
}

export const getRegionList = createServerFn({ method: "POST" }).handler(async () => {
  return REGIONS.map((r) => ({ slug: r.slug, name: r.name, code: r.code, blurb: r.blurb }));
});

export const getRegionDashboard = createServerFn({ method: "POST" })
  .validator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 60) }))
  .handler(async ({ data }): Promise<RegionDashboard | null> => {
    const region = regionBySlug(data.slug);
    if (!region) return null;

    const [layers, stats] = await Promise.all([getMapLayers(), getUkStats()]);

    const hpi = layers.find((l) => l.id === "house-prices");
    const hpiArea = hpi?.areas.find((a) => a.code === region.code) ?? null;
    const housePrice = hpiArea
      ? {
          formatted: hpiArea.formatted,
          period: hpi!.period,
          source: hpi!.source,
          sourceUrl: hpi!.sourceUrl,
        }
      : null;

    const gaps: string[] = [];
    let crimeLayers: RegionCrimeLayer[] = [];

    if (region.crimeSource === "pfa") {
      const wanted = new Set(region.pfas.map(normPfa));
      crimeLayers = layers
        .filter((l) => l.boundary === "pfa")
        .map((l) => ({
          id: l.id,
          title: l.title,
          unit: l.unit,
          source: l.source,
          sourceUrl: l.sourceUrl,
          period: l.period,
          asOf: l.asOf,
          coverage: l.coverage,
          areas: l.areas.filter((a) => wanted.has(normPfa(a.name))),
        }))
        .filter((l) => l.areas.length > 0);
      if (!crimeLayers.length) gaps.push("Recorded crime by police force area could not be read from the source for this request.");
    } else if (region.crimeSource === "scotland-council") {
      crimeLayers = layers
        .filter((l) => l.boundary === "scotland-council")
        .map((l) => ({
          id: l.id,
          title: l.title.replace(/^Scotland — /, ""),
          unit: l.unit,
          source: l.source,
          sourceUrl: l.sourceUrl,
          period: l.period,
          asOf: l.asOf,
          coverage: l.coverage,
          areas: l.areas,
        }));
      if (!crimeLayers.length) gaps.push("Recorded crime by council area could not be read from statistics.gov.scot for this request.");
    } else {
      gaps.push(
        "Recorded crime in Northern Ireland is published by the PSNI in its own statistics series; no machine-readable feed is available to this site.",
      );
    }

    let nhs: Metric[] = [];
    if (region.slug === "scotland") {
      nhs = stats.metrics.filter((m) => m.category === "NHS & doctors" && m.status === "ok");
    } else {
      gaps.push(
        "NHS performance figures for this area are published by NHS England / the devolved boards but are not served in a machine-readable form to automated clients.",
      );
    }

    return { region, housePrice, crimeLayers, nhs, gaps, fetchedAt: stats.fetchedAt };
  });
