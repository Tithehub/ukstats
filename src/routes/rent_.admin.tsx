import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { adminListChannels, adminSetEntitlement } from "@/lib/rent-channel.functions";
import type { Entitlement } from "@/lib/rent-entitlements";

export const Route = createFileRoute("/rent_/admin")({
  head: () => ({ meta: [
    { title: "Rented channels admin — UKStats" },
    { name: "description", content: "Review, approve and pause rented UKStats stream channels." },
    { property: "og:title", content: "Rented channels admin — UKStats" },
    { property: "og:description", content: "Admin review of rented UKStats stream channels." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminPage,
});

type Row = Awaited<ReturnType<typeof adminListChannels>>[number];
const BADGE: Record<string, string> = { draft: "bg-night-line", pending: "bg-ageing text-night", active: "bg-fresh text-night", paused: "bg-overdue" };

function AdminPage() {
  const { signedIn, loading } = useAuth();
  return <div className="min-h-screen bg-night text-night-fg">
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-electric">Rent UKStats · admin</p>
      <h1 className="mt-2 text-3xl font-black">Rented channels</h1>
      {loading ? <p className="mt-6 text-night-muted">Loading…</p> : !signedIn
        ? <Button asChild className="mt-6"><Link to="/auth" search={{ next: "/rent/admin" }}>Sign in</Link></Button> : <List />}
    </main>
    <SiteFooter />
  </div>;
}

function List() {
  const list = useServerFn(adminListChannels), setEnt = useServerFn(adminSetEntitlement);
  const { data, error, refetch } = useQuery({ queryKey: ["admin-rent-channels"], queryFn: () => list(), retry: false });
  if (error) return <p className="mt-6 text-overdue">Admins only.</p>;
  if (!data) return <p className="mt-6 text-night-muted">Loading channels…</p>;
  const pending = data.filter((c) => c.status === "pending").length;
  const save = async (c: Row, e: Entitlement, status?: "active" | "paused") => {
    const r = await setEnt({ data: { userId: c.user_id, ...e, ...(status && { status }) } });
    if ("error" in r) toast.error(String(r.error)); else { toast.success(`${c.display_name} updated`); refetch(); }
  };
  return <>
    {pending > 0 && <p className="mt-4 rounded-lg bg-ageing px-4 py-2 font-semibold text-night">{pending} channel{pending === 1 ? "" : "s"} waiting for review</p>}
    <div className="mt-6 grid gap-3">
      {data.map((c) => <AdminRow key={c.user_id} c={c} onSave={save} />)}
      {!data.length && <p className="text-night-muted">No channels yet.</p>}
    </div>
  </>;
}

function AdminRow({ c, onSave }: { c: Row; onSave: (c: Row, e: Entitlement, s?: "active" | "paused") => void }) {
  const [e, setE] = useState(c.entitlement);
  const b = (k: "all_countries" | "ai_presenter" | "no_sponsor_box", label: string) => <label className="flex items-center gap-1"><input type="checkbox" checked={e[k]} onChange={(x) => setE({ ...e, [k]: x.target.checked })} />{label}</label>;
  return <div className="rounded-xl border border-night-line bg-night-panel p-4 text-sm">
    <div className="flex flex-wrap items-center gap-3">
      <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold uppercase ${BADGE[c.status] ?? "bg-night-line"}`}>{c.status}</span>
      <span className="text-base font-bold">{c.display_name}</span>
      <a className="font-mono text-xs text-electric underline" href={`/s/${c.slug}/broadcast?preview=1`} target="_blank" rel="noopener">/s/{c.slug} preview</a>
      <span className="text-night-muted">{c.email}</span>
      {c.requested_at && <span className="text-xs text-night-muted">requested {new Date(c.requested_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}</span>}
      {c.source === "stripe" && <span className="rounded bg-electric/30 px-2 text-xs">paid via Stripe</span>}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-1">Countries<input type="number" min={1} max={300} className="w-16 rounded border border-night-line bg-night px-1" value={e.max_countries} onChange={(x) => setE({ ...e, max_countries: Number(x.target.value) })} /></label>
      {b("all_countries", "All countries")}{b("ai_presenter", "AI presenter")}{b("no_sponsor_box", "No sponsor box")}
      <label className="flex items-center gap-1">Until<input type="date" className="rounded border border-night-line bg-night px-1" value={e.expires_at?.slice(0, 10) ?? ""} onChange={(x) => setE({ ...e, expires_at: x.target.value ? `${x.target.value}T23:59:59Z` : null })} /></label>
      <Button size="sm" onClick={() => onSave(c, e, "active")}>Approve / switch on</Button>
      <Button size="sm" variant="outline" onClick={() => onSave(c, e, "paused")}>Pause</Button>
    </div>
    {c.source === "stripe" && <p className="mt-2 text-xs text-night-muted">Saving here turns this into a manual grant and stops Stripe updating it.</p>}
  </div>;
}
