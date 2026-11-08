import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { Button } from "@/components/ui/button";
import { getSponsorBannerBoard } from "@/lib/banner.functions";
import { readPaymentsEnvironment } from "@/lib/payments-env";
import { directoryEntries, filterDirectory } from "@/lib/directory";
import { placeName } from "@/lib/sponsor-regions";
import { getDirectoryReviews } from "@/lib/review-links.functions";

const directoryQuery = queryOptions({
  queryKey: ["business-directory"],
  queryFn: async () => {
    const env = readPaymentsEnvironment() ?? "sandbox";
    const rows = (await getSponsorBannerBoard({ data: { environment: env } })).sponsors;
    const banners = new Map(rows.flatMap((r) => (r.banner_link || r.banner_url ? [[r.id, (r.banner_link || r.banner_url)!] as [string, string]] : [])));
    const entries = directoryEntries(rows, env, new Date(), banners);
    const reviews = entries.length ? await getDirectoryReviews({ data: { ids: entries.map((e) => e.id) } }).catch(() => ({})) : {};
    return entries.map((e) => ({ ...e, reviews: (reviews as Record<string, { platform: string; label: string; url: string }[]>)[e.id] ?? [] }));
  },
  staleTime: 60_000,
});

export const Route = createFileRoute("/business-directory")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; region?: string | undefined } => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 100) : undefined,
    region: typeof s["region"] === "string" && s["region"] ? s["region"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(directoryQuery),
  head: () => ({
    meta: [
      { title: "Business Directory — UKStats sponsors" },
      { name: "description", content: "Directory of the approved businesses that sponsor UKStats and keep official UK and world statistics free for everyone." },
      { property: "og:title", content: "Business Directory — UKStats sponsors" },
      { property: "og:description", content: "The approved businesses that keep UKStats free. Sponsors never see or influence any figure." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/business-directory" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/business-directory" }],
  }),
  component: DirectoryPage,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function DirectoryPage() {
  const { data: all } = useSuspenseQuery(directoryQuery);
  const { q = "", region = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/business-directory" });
  const list = filterDirectory(all, q, region);
  const regionOptions = [...new Set(all.flatMap((e) => e.regions).filter((r) => r !== "all"))].sort();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Sponsored businesses</p>
        <h1 className="mt-2 text-3xl font-semibold">Business Directory</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Every business here sponsors UKStats and has been approved by us. They keep the statistics free. Sponsors never see or influence any figure.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><Link to="/advertise">Get your business listed</Link></Button>
          <Button asChild variant="outline"><Link to="/sponsors">Our sponsors</Link></Button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search businesses</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-night-muted" aria-hidden />
            <input
              type="search" value={q} placeholder="Search by name or what they do"
              onChange={(e) => navigate({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })}
              className="h-11 w-full rounded-md border border-night-line bg-night-panel/60 pl-9 pr-3 text-sm"
            />
          </label>
          <label>
            <span className="sr-only">Region</span>
            <select
              value={region}
              onChange={(e) => navigate({ search: (p) => ({ ...p, region: e.target.value || undefined }) })}
              className="h-11 w-full rounded-md border border-night-line bg-night-panel/60 px-3 text-sm sm:w-64"
            >
              <option value="">All regions</option>
              {regionOptions.map((r) => <option key={r} value={r}>{placeName(r)}</option>)}
            </select>
          </label>
        </div>

        {all.length === 0 ? (
          <p className="mt-10">No businesses listed yet. <Link to="/advertise" className="text-electric-soft underline">Be the first</Link>.</p>
        ) : list.length === 0 ? (
          <p className="mt-10 text-night-muted">No businesses match your search.</p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <li key={e.id} className="flex flex-col overflow-hidden rounded-md border border-night-line bg-night-panel/60">
                {e.banner && <img src={e.banner} alt={`${e.name} banner`} className="aspect-[3/1] w-full object-cover" loading="lazy" />}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-lg font-semibold">{e.name}</h2>
                  <p className="font-mono text-xs text-night-muted">{e.domain}</p>
                  {e.tagline && <p className="mt-2 text-sm">{e.tagline}</p>}
                  <p className="mt-3 text-xs text-night-muted">{e.regionLabels.join(" · ")}</p>
                  {e.reviews.length > 0 && (
                    <div className="mt-3">
                      <ul className="flex flex-wrap gap-2" aria-label={`${e.name} reviews`}>
                        {e.reviews.map((r) => (
                          <li key={r.platform}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" referrerPolicy="no-referrer" className="inline-flex items-center gap-1 rounded-full border border-night-line px-2.5 py-1 text-xs hover:border-electric">
                              {r.label} <ExternalLink className="size-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-[11px] text-night-muted">Reviews are hosted by each review site. UKStats does not check, edit or score them.</p>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-4 self-start">
                    <a href={e.url} target="_blank" rel="sponsored noopener noreferrer">Visit website <ExternalLink className="size-3.5" /></a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
