// Business directory: the public view of sponsored businesses. Pure helpers, shared by the page and the PDF.
import { visibleSponsors, type SponsorVisibilityRow } from "@/lib/sponsor-visibility";
import { placeName, rowRegions } from "@/lib/sponsor-regions";

export type DirectoryEntry = { id: string; name: string; url: string; domain: string; tagline: string | null; regions: string[]; regionLabels: string[]; banner: string | null };
type Row = SponsorVisibilityRow & { region?: string | null; regions?: string[] | null };

export function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/** Only approved, switched-on, paid, in-date sponsors of `environment`, sorted by name — nothing else is listed. */
export function directoryEntries(rows: readonly Row[], environment: string, now: Date = new Date(), banners: Map<string, string> = new Map()): DirectoryEntry[] {
  return visibleSponsors(rows, environment, now)
    .map((r) => {
      const regions = rowRegions(r);
      return { id: r.id, name: r.name, url: r.url, domain: domainOf(r.url), tagline: r.tagline, regions, regionLabels: regions.map(placeName), banner: banners.get(r.id) ?? null };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Search + region filter used by the directory page. Region "all" listings match every region. */
export function filterDirectory(list: readonly DirectoryEntry[], q: string, region: string): DirectoryEntry[] {
  const needle = q.trim().toLowerCase();
  return list.filter((e) =>
    (!needle || `${e.name} ${e.domain} ${e.tagline ?? ""}`.toLowerCase().includes(needle)) &&
    (!region || e.regions.includes("all") || e.regions.includes(region)));
}
