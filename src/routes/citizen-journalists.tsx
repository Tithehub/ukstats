import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoadError, PageNotFound } from "@/components/layout/PageFeedback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { PLATFORMS, PLATFORM_LABEL, filterJournalists, platformsOf } from "@/lib/citizen-journalists";
import {
  adminAddCitizen, adminCitizenList, adminReviewCitizen, applyCitizenJournalist, citizenJournalistsQuery, myCitizenApplications,
  type ApplicationInput,
} from "@/lib/citizen-journalists.functions";
import { fmtDate } from "@/lib/uk-stats";

const TITLE = "Citizen Journalists — independent creators directory | UKStats";
const DESC = "A reviewed directory of independent citizen journalists from every political stance and background, with their latest videos and links.";

export const Route = createFileRoute("/citizen-journalists")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; platform?: string | undefined } => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 80) : undefined,
    platform: typeof s["platform"] === "string" && s["platform"] ? s["platform"] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(citizenJournalistsQuery),
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { property: "og:url", content: "https://ukstats.co.uk/citizen-journalists" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/citizen-journalists" }],
  }),
  component: Page,
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
});

function Page() {
  const { data: all } = useSuspenseQuery(citizenJournalistsQuery);
  const { q = "", platform } = Route.useSearch();
  const navigate = useNavigate({ from: "/citizen-journalists" });
  const list = filterJournalists(all, q, platform);
  const { isAdmin } = useIsAdmin();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Citizen Journalists</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Independent reporters and commentators, open to every political stance, religion and background. Every listing is reviewed by UKStats before it appears.</p>
        <p className="mt-3 rounded border border-border bg-muted/40 p-3 text-sm">Independent creators — not official sources. Listing is not endorsement, and nothing here feeds UKStats figures.</p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <label className="flex min-w-64 flex-1 items-center gap-2 rounded border border-border px-3">
            <Search className="size-4" aria-hidden />
            <input value={q} onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }), replace: true })} placeholder="Search by name" className="h-11 w-full bg-transparent outline-none" />
          </label>
          <select value={platform ?? ""} onChange={(e) => navigate({ search: (s) => ({ ...s, platform: e.target.value || undefined }), replace: true })} className="h-11 rounded border border-border bg-background px-2">
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </select>
        </div>

        {all.length === 0 ? (
          <p className="mt-8 rounded border border-dashed border-border p-6 text-center text-muted-foreground">The first listings are being reviewed. Apply below to be considered.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((j) => (
              <article key={j.id} className="flex flex-col rounded border border-border p-4">
                <div className="flex items-center gap-3">
                  {j.photo_url ? <img src={j.photo_url} alt="" className="size-14 rounded-full object-cover" loading="lazy" /> : <div className="grid size-14 place-items-center rounded-full bg-muted text-lg font-bold">{j.name[0]}</div>}
                  <h2 className="text-lg font-semibold">{j.name}</h2>
                </div>
                {j.bio && <p className="mt-2 text-sm text-muted-foreground">{j.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {platformsOf(j).map((p) => (
                    <a key={p} href={j[`${p}_url`]!} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-9 items-center gap-1 rounded border border-border px-2 text-xs">{PLATFORM_LABEL[p]}<ExternalLink className="size-3" /></a>
                  ))}
                </div>
                {j.videos.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {j.videos.map((v) => (
                      <li key={v.id}><a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-sm">
                        <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" className="h-12 w-20 shrink-0 rounded object-cover" loading="lazy" />
                        <span><span className="line-clamp-2">{v.title}</span><span className="text-xs text-muted-foreground">{fmtDate(v.published)}</span></span>
                      </a></li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}

        <ApplySection />
        {isAdmin && <AdminReview />}
      </main>
      <SiteFooter />
    </>
  );
}

const FIELDS: { k: keyof ApplicationInput; label: string; long?: boolean }[] = [
  { k: "name", label: "Name" }, { k: "bio", label: "Short bio (max 600 characters)", long: true },
  { k: "photo_url", label: "Photo link (https://…)" }, { k: "youtube_url", label: "YouTube channel link (youtube.com/channel/… shows latest videos)" },
  { k: "x_url", label: "X link" }, { k: "rumble_url", label: "Rumble link" }, { k: "substack_url", label: "Substack link" }, { k: "website_url", label: "Website" },
];

function Form({ onSubmit, cta }: { onSubmit: (d: ApplicationInput) => Promise<unknown>; cta: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault();
      const f = e.currentTarget; const d = Object.fromEntries(new FormData(f)) as unknown as ApplicationInput;
      setBusy(true);
      try { await onSubmit(d); f.reset(); } catch (err) { toast.error(err instanceof Error ? err.message : "Something went wrong"); } finally { setBusy(false); }
    }}>
      {FIELDS.map((x) => (
        <label key={x.k} className={`grid gap-1 text-sm ${x.long ? "sm:col-span-2" : ""}`}>{x.label}
          {x.long ? <textarea name={x.k} maxLength={600} rows={3} className="rounded border border-border bg-background p-2" />
            : <input name={x.k} required={x.k === "name"} className="h-11 rounded border border-border bg-background px-2" />}
        </label>
      ))}
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Sending…" : cta}</Button></div>
    </form>
  );
}

function ApplySection() {
  const { user } = useAuth();
  const apply = useServerFn(applyCitizenJournalist);
  const mine = useServerFn(myCitizenApplications);
  const qc = useQueryClient();
  const { data: apps } = useQuery({ queryKey: ["my-citizen-apps", user?.id], queryFn: () => mine(), enabled: !!user });
  return (
    <section className="mt-12 rounded border border-border p-5">
      <h2 className="text-xl font-semibold">Apply to be listed</h2>
      <p className="mt-1 text-sm text-muted-foreground">Open to citizen journalists of any political stance or religion. Every application is reviewed internally before it appears.</p>
      {!user ? (
        <Button asChild className="mt-4"><Link to="/auth">Sign in to apply</Link></Button>
      ) : (
        <>
          <Form cta="Send application" onSubmit={async (d) => { await apply({ data: d }); toast.success("Application sent for review"); await qc.invalidateQueries({ queryKey: ["my-citizen-apps"] }); }} />
          {apps && apps.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {apps.map((a) => <li key={a.id}>{a.name}: <strong className="capitalize">{a.status}</strong>{a.review_note && ` — ${a.review_note}`}</li>)}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function AdminReview() {
  const list = useServerFn(adminCitizenList);
  const review = useServerFn(adminReviewCitizen);
  const add = useServerFn(adminAddCitizen);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-citizen"], queryFn: () => list() });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["admin-citizen"] }), qc.invalidateQueries({ queryKey: ["citizen-journalists"] })]);
  const act = async (id: string, status: "approved" | "rejected" | "pending" | "delete") => {
    const note = status === "rejected" ? window.prompt("Reason (optional, shown to applicant)") ?? undefined : undefined;
    try { await review({ data: { id, status, ...(note ? { note } : {}) } }); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  return (
    <section className="mt-10 rounded border-2 border-primary p-5">
      <h2 className="text-xl font-semibold">Admin: review citizen journalists</h2>
      <details className="mt-3"><summary className="cursor-pointer font-medium">Add to the default list (approved straight away)</summary>
        <Form cta="Add and approve" onSubmit={async (d) => { await add({ data: d }); toast.success("Added"); await refresh(); }} />
      </details>
      <ul className="mt-4 divide-y divide-border">
        {data.map((j) => (
          <li key={j.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
            <span className="min-w-48 flex-1"><strong>{j.name}</strong> <span className="capitalize text-muted-foreground">· {j.status}</span>{j.bio && <span className="block text-xs text-muted-foreground">{j.bio}</span>}</span>
            {j.status !== "approved" && <Button size="sm" onClick={() => act(j.id, "approved")}>Approve</Button>}
            {j.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => act(j.id, "rejected")}>Reject</Button>}
            <Button size="sm" variant="ghost" onClick={() => window.confirm("Delete this listing?") && act(j.id, "delete")}>Delete</Button>
          </li>
        ))}
        {data.length === 0 && <li className="py-2 text-sm text-muted-foreground">No applications yet.</li>}
      </ul>
    </section>
  );
}
