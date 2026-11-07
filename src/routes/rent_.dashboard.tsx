import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { COUNTRIES } from "@/lib/countries";
import { getMyChannel, saveMyChannel, adminListChannels, adminSetEntitlement } from "@/lib/rent-channel.functions";
import { RENT_LAYOUTS, slugify, type ChannelSettings, type Entitlement } from "@/lib/rent-entitlements";

export const Route = createFileRoute("/rent_/dashboard")({
  head: () => ({ meta: [
    { title: "My stream dashboard — Rent UKStats" },
    { name: "description", content: "Set up your branded UKStats stream: name, logo, colours, countries and presenter, with an OBS link." },
    { property: "og:title", content: "My stream dashboard — Rent UKStats" },
    { property: "og:description", content: "Brand and run your own official-statistics stream powered by UKStats." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: RentDashboard,
});

const ALL = [{ code: "gb", name: "United Kingdom" }, ...COUNTRIES.map((c) => ({ code: c.code, name: c.name }))];
const EMPTY: ChannelSettings = { slug: "", display_name: "", logo_url: null, accent: "#051D3F", presented_by: null, layout: "classic", countries: ["gb"], all_countries: false, presenter: "self", show_sponsor_box: true };
const field = "mt-1 w-full rounded border border-night-line bg-night-panel px-3 py-2 text-night-fg";

function RentDashboard() {
  const { signedIn, loading } = useAuth();
  return <div className="min-h-screen bg-night text-night-fg">
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase text-electric">Rent UKStats</p>
      <h1 className="mt-2 text-3xl font-semibold">My stream dashboard</h1>
      {loading ? <p className="mt-8 text-night-muted">Loading…</p> : !signedIn
        ? <Button asChild className="mt-6"><Link to="/auth">Sign in to set up your stream</Link></Button>
        : <Editor />}
    </main>
    <SiteFooter />
  </div>;
}

function Editor() {
  const get = useServerFn(getMyChannel), save = useServerFn(saveMyChannel);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-rent-channel"], queryFn: () => get() });
  const [f, setF] = useState<ChannelSettings>(EMPTY);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data?.channel) setF({ ...EMPTY, ...data.channel }); }, [data?.channel]);
  if (isLoading || !data) return <p className="mt-8 text-night-muted">Loading your channel…</p>;
  const e = data.entitlement;
  const set = (p: Partial<ChannelSettings>) => setF((o) => ({ ...o, ...p }));
  const toggleCountry = (code: string) => set({ countries: f.countries.includes(code) ? f.countries.filter((c) => c !== code) : [...f.countries, code] });
  const onSave = async () => {
    setBusy(true);
    try {
      const r = await save({ data: { ...f, slug: f.slug || slugify(f.display_name) } });
      if ("error" in r) toast.error(r.error); else { toast.success("Channel saved"); await qc.invalidateQueries({ queryKey: ["my-rent-channel"] }); }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); } finally { setBusy(false); }
  };
  const slug = data.channel?.slug;
  const obsUrl = slug ? `https://ukstats.co.uk/s/${slug}/broadcast` : null;

  return <div className="mt-6 grid gap-8">
    <section className="rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="text-lg font-semibold">Your plan</h2>
      <p className="mt-1 text-sm">{data.live ? "Active" : "Not active yet — we'll switch your channel on once your plan is confirmed. Paid checkout is coming next."}</p>
      <p className="mt-1 font-mono text-xs text-night-muted">Countries: {e.all_countries ? "all" : e.max_countries} · AI presenter: {e.ai_presenter ? "yes" : "no"} · Sponsor box removal: {e.no_sponsor_box ? "yes" : "no"}{e.expires_at ? ` · until ${new Date(e.expires_at).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}` : ""}</p>
    </section>

    <section className="grid gap-4 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Branding</h2>
      <label className="text-sm">Channel name<input className={field} value={f.display_name} maxLength={60} onChange={(x) => set({ display_name: x.target.value })} /></label>
      <label className="text-sm">Web address (ukstats.co.uk/s/…)<input className={field} value={f.slug} placeholder={slugify(f.display_name)} maxLength={40} onChange={(x) => set({ slug: slugify(x.target.value) })} /></label>
      <label className="text-sm">Logo image link (https)<input className={field} value={f.logo_url ?? ""} placeholder="https://…/logo.png" onChange={(x) => set({ logo_url: x.target.value || null })} /></label>
      <label className="text-sm">"Presented by"<input className={field} value={f.presented_by ?? ""} maxLength={80} onChange={(x) => set({ presented_by: x.target.value || null })} /></label>
      <label className="text-sm">Accent colour<input type="color" className="mt-1 block h-10 w-20" value={f.accent} onChange={(x) => set({ accent: x.target.value })} /></label>
      <label className="text-sm">Layout<select className={field} value={f.layout} onChange={(x) => set({ layout: x.target.value as ChannelSettings["layout"] })}>
        {RENT_LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
    </section>

    <section>
      <h2 className="text-lg font-semibold">Countries</h2>
      <p className="text-sm text-night-muted">Your plan allows {e.all_countries ? "all countries" : `${e.max_countries} ${e.max_countries === 1 ? "country" : "countries"}`}. Extra picks are dropped when you save.</p>
      {e.all_countries && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.all_countries} onChange={(x) => set({ all_countries: x.target.checked })} /> Show all countries</label>}
      {!f.all_countries && <div className="mt-3 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto rounded border border-night-line p-2 sm:grid-cols-4">
        {ALL.map((c) => <label key={c.code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.countries.includes(c.code)} onChange={() => toggleCountry(c.code)} />{c.name}</label>)}
      </div>}
    </section>

    <section className="grid gap-2">
      <h2 className="text-lg font-semibold">Presenter and sponsors</h2>
      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={f.presenter === "self"} onChange={() => set({ presenter: "self" })} /> I'll present myself (camera window + autocue)</label>
      <label className="flex items-center gap-2 text-sm"><input type="radio" disabled={!e.ai_presenter} checked={f.presenter === "ai"} onChange={() => set({ presenter: "ai" })} /> UKStats AI presenter (labelled AI){!e.ai_presenter && " — add to your plan"}</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!e.no_sponsor_box} checked={!f.show_sponsor_box} onChange={(x) => set({ show_sponsor_box: !x.target.checked })} /> Hide the UKStats sponsor box{!e.no_sponsor_box && " — add to your plan"}</label>
      <p className="text-xs text-night-muted">You control branding only. Every figure keeps its source, period, data age and next release, plus a "Data: UKStats" credit.</p>
    </section>

    <Button onClick={onSave} disabled={busy || !f.display_name.trim()} className="w-fit">{busy ? "Saving…" : "Save channel"}</Button>

    {obsUrl && <section className="rounded-lg border border-night-line bg-night-panel p-4">
      <h2 className="text-lg font-semibold">Go live with OBS</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        <li>In OBS add a <b>Browser</b> source, 1920 × 1080{f.layout === "portrait" ? " (portrait: 1080 × 1920)" : ""}.</li>
        <li>Paste this link: <code className="break-all font-mono text-electric">{obsUrl}</code> <button className="underline" onClick={() => navigator.clipboard.writeText(obsUrl).then(() => toast.success("Link copied"))}>Copy</button></li>
        <li>Tick "Control audio via OBS"{f.presenter === "self" ? ", and place your camera over the dashed camera window" : ""}.</li>
        <li>Stream to YouTube, Twitch or X with your own stream key — it never goes on this site.</li>
      </ol>
      <div className="mt-3 flex gap-3 text-sm"><a className="underline" href={`/s/${slug}`} target="_blank" rel="noopener">Public watch page</a><a className="underline" href={`/s/${slug}/broadcast`} target="_blank" rel="noopener">Open full-size stream</a></div>
      {data.live && <div className="relative mt-4 aspect-video overflow-hidden rounded border border-night-line"><iframe title="Your stream preview" src={`/s/${slug}/broadcast?voice=off`} className="absolute inset-0 h-full w-full border-0" /></div>}
    </section>}

    {data.isAdmin && <AdminPanel />}
  </div>;
}

function AdminPanel() {
  const list = useServerFn(adminListChannels), setEnt = useServerFn(adminSetEntitlement);
  const { data, refetch } = useQuery({ queryKey: ["admin-rent-channels"], queryFn: () => list() });
  return <section className="rounded-lg border-2 border-electric p-4">
    <h2 className="text-lg font-semibold">Admin · switch channels on and grant features</h2>
    <div className="mt-3 divide-y divide-night-line">
      {(data ?? []).map((c) => <AdminRow key={c.user_id} c={c} onSave={async (e) => {
        const r = await setEnt({ data: { userId: c.user_id, ...e } });
        if ("error" in r) toast.error(String(r.error)); else { toast.success(`${c.display_name} updated`); refetch(); }
      }} />)}
      {data && !data.length && <p className="text-sm text-night-muted">No channels yet.</p>}
    </div>
  </section>;
}

function AdminRow({ c, onSave }: { c: { slug: string; display_name: string; entitlement: Entitlement }; onSave: (e: Entitlement) => void }) {
  const [e, setE] = useState(c.entitlement);
  const b = (k: keyof Entitlement, label: string) => <label className="flex items-center gap-1"><input type="checkbox" checked={!!e[k]} onChange={(x) => setE({ ...e, [k]: x.target.checked })} />{label}</label>;
  return <div className="flex flex-wrap items-center gap-3 py-2 text-sm">
    <span className="min-w-40 font-semibold">{c.display_name} <span className="font-mono text-xs text-night-muted">/s/{c.slug}</span></span>
    {b("active", "Active")}
    <label className="flex items-center gap-1">Countries<input type="number" min={1} max={300} className="w-16 rounded border border-night-line bg-night-panel px-1" value={e.max_countries} onChange={(x) => setE({ ...e, max_countries: Number(x.target.value) })} /></label>
    {b("all_countries", "All countries")}{b("ai_presenter", "AI presenter")}{b("no_sponsor_box", "No sponsor box")}
    <label className="flex items-center gap-1">Until<input type="date" className="rounded border border-night-line bg-night-panel px-1" value={e.expires_at?.slice(0, 10) ?? ""} onChange={(x) => setE({ ...e, expires_at: x.target.value ? `${x.target.value}T23:59:59Z` : null })} /></label>
    <Button size="sm" onClick={() => onSave(e)}>Save</Button>
  </div>;
}
