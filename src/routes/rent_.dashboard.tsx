import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Check, Copy, CreditCard, ExternalLink, Image as ImageIcon, Radio, Tv } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { gbp } from "@/lib/rent-pricing";
import { planPence, type RentPlan } from "@/lib/rent-checkout";
import { checkSlug, createRentCheckout, createRentPortal, getMyChannel, requestActivation, saveMyChannel } from "@/lib/rent-channel.functions";
import { slugify, type ChannelSettings } from "@/lib/rent-entitlements";

export const Route = createFileRoute("/rent_/dashboard")({
  validateSearch: (s: Record<string, unknown>): { checkout?: "done" } => (s["checkout"] === "done" ? { checkout: "done" } : {}),
  head: () => ({ meta: [
    { title: "My stream dashboard — Rent UKStats" },
    { name: "description", content: "Set up your branded UKStats stream: name, logo, colours, countries and presenter, then choose a plan and get your OBS link." },
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
const field = "mt-1 w-full rounded-lg border border-night-line bg-night px-3 py-2 text-night-fg focus:outline-none focus:ring-2 focus:ring-electric";
const STEPS = ["Name", "Branding", "Countries & layout", "Presenter"] as const;
const LAYOUTS: { id: ChannelSettings["layout"]; label: string; note: string; boxes: string }[] = [
  { id: "classic", label: "Classic", note: "Big globe, figures on the right", boxes: "grid-cols-[2fr_1fr]" },
  { id: "split", label: "Split", note: "Half globe, half figures", boxes: "grid-cols-2" },
  { id: "data-wall", label: "Data wall", note: "Figures first, smaller globe", boxes: "grid-cols-[1fr_1.3fr]" },
  { id: "portrait", label: "Portrait", note: "9:16 for Shorts, TikTok, Reels", boxes: "grid-rows-2" },
];
const STATUS: Record<string, { label: string; cls: string; text: string }> = {
  draft: { label: "Draft", cls: "bg-night-line", text: "Finish setup, then choose a plan to go live." },
  pending: { label: "Pending review", cls: "bg-ageing text-night", text: "We've got your request and will switch your channel on shortly." },
  active: { label: "Active", cls: "bg-fresh text-night", text: "Your channel is live. Paste the OBS link below to stream." },
  paused: { label: "Paused", cls: "bg-overdue", text: "Your channel is switched off. Choose a plan or request activation to turn it back on." },
};

function RentDashboard() {
  const { signedIn, loading } = useAuth();
  return <div className="min-h-screen bg-night text-night-fg">
    <PaymentTestModeBanner />
    <SiteHeader />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-electric">Rent UKStats · your branded stream</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">My stream dashboard</h1>
      {loading ? <p className="mt-8 text-night-muted">Loading…</p> : !signedIn
        ? <div className="mt-6 max-w-xl rounded-xl border border-night-line bg-night-panel p-6">
            <p className="text-lg">Run official UK and world statistics as your own branded live channel — from £9 a month.</p>
            <Button asChild className="mt-4"><Link to="/auth" search={{ next: "/rent/dashboard" }}>Sign in or create an account</Link></Button>
          </div>
        : <Editor />}
    </main>
    <SiteFooter />
  </div>;
}

function Editor() {
  const get = useServerFn(getMyChannel), save = useServerFn(saveMyChannel), check = useServerFn(checkSlug), request = useServerFn(requestActivation);
  const qc = useQueryClient();
  const { checkout } = Route.useSearch();
  const { data, isLoading } = useQuery({ queryKey: ["my-rent-channel"], queryFn: () => get(), refetchInterval: (q) => checkout === "done" && !q.state.data?.live ? 3000 : false });
  const [f, setF] = useState<ChannelSettings>(EMPTY);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [slugState, setSlugState] = useState<{ ok: boolean; reason: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  useEffect(() => { if (data?.channel) { setF({ ...EMPTY, ...data.channel }); setLogoPreview(data.channel.logo_preview); } }, [data?.channel]);

  const slug = f.slug || slugify(f.display_name);
  useEffect(() => {
    if (slug.length < 3) { setSlugState(null); return; }
    const t = setTimeout(() => check({ data: { slug } }).then((r) => setSlugState({ ok: r.ok, reason: r.reason })).catch(() => {}), 400);
    return () => clearTimeout(t);
  }, [slug, check]);

  if (isLoading || !data) return <p className="mt-8 text-night-muted">Loading your channel…</p>;
  const set = (p: Partial<ChannelSettings>) => setF((o) => ({ ...o, ...p }));
  const status = data.channel?.status ?? "draft";
  const st = STATUS[data.live ? "active" : status] ?? STATUS["draft"]!;
  const savedSlug = data.channel?.slug;

  const persist = async (quiet = false) => {
    setBusy(true);
    try {
      const r = await save({ data: { ...f, slug } });
      if ("error" in r) { toast.error(r.error); return false; }
      if (!quiet) toast.success("Saved");
      await qc.invalidateQueries({ queryKey: ["my-rent-channel"] });
      setPreviewKey((k) => k + 1);
      return true;
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); return false; } finally { setBusy(false); }
  };
  const next = async () => { if (await persist(true)) setStep((s) => Math.min(STEPS.length, s + 1)); };

  const uploadLogo = async (file: File) => {
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) return toast.error("Use a PNG, JPG, WebP or SVG image");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be 2 MB or smaller");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const name = `logo-${Date.now()}.${file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png"}`;
    const path = `${u.user.id}/${name}`;
    const { error } = await supabase.storage.from("rent-logos").upload(path, file, { upsert: true, contentType: file.type });
    if (error) return toast.error("Upload failed — please try again");
    set({ logo_url: `storage:${path}` });
    setLogoPreview(URL.createObjectURL(file));
    toast.success("Logo uploaded — press Save to apply");
  };

  return <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <div className="space-y-6">
      <section className="flex items-start gap-3 rounded-xl border border-night-line bg-night-panel p-4">
        <span className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${st.cls}`}>{data.live ? "Active" : st.label}</span>
        <div className="text-sm">
          <p>{st.text}</p>
          {data.billing?.status === "past_due" && <p className="mt-1 font-semibold text-overdue">Your last payment failed. Update your card in Manage billing — your stream stays on while we retry.</p>}
          {data.billing?.cancelAtPeriodEnd && data.entitlement.expires_at && <p className="mt-1 text-ageing">Cancelled — stays live until {new Date(data.entitlement.expires_at).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}.</p>}
          {checkout === "done" && !data.live && <p className="mt-1 text-electric">Payment received — switching your channel on…</p>}
        </div>
      </section>

      <ol className="grid grid-cols-4 gap-2" aria-label="Setup steps">
        {STEPS.map((s, i) => <li key={s}><button onClick={() => setStep(i)} className={`w-full rounded-lg border px-2 py-2 text-left text-xs sm:text-sm ${i === step ? "border-electric bg-night-panel" : "border-night-line"}`}>
          <span className="font-mono text-electric">{i + 1}</span> {s}</button></li>)}
      </ol>

      <section className="rounded-xl border border-night-line bg-night-panel p-5">
        {step === 0 && <div className="grid gap-4">
          <h2 className="text-xl font-bold">Name your channel</h2>
          <label className="text-sm">Channel name<input className={field} value={f.display_name} maxLength={60} placeholder="e.g. Britain Tonight" onChange={(x) => set({ display_name: x.target.value })} /></label>
          <label className="text-sm">Web address
            <div className="mt-1 flex items-center rounded-lg border border-night-line bg-night"><span className="pl-3 font-mono text-xs text-night-muted">ukstats.co.uk/s/</span>
              <input className="w-full bg-transparent px-1 py-2 font-mono focus:outline-none" value={f.slug} placeholder={slugify(f.display_name) || "your-name"} maxLength={40} onChange={(x) => set({ slug: slugify(x.target.value) })} /></div>
            {slugState && <span className={`mt-1 block text-xs ${slugState.ok ? "text-fresh" : "text-overdue"}`}>{slugState.ok ? "✓ " : "✗ "}{slugState.reason}</span>}
          </label>
        </div>}
        {step === 1 && <div className="grid gap-4">
          <h2 className="text-xl font-bold">Your branding</h2>
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-night-line bg-night">{logoPreview ? <img src={logoPreview} alt="Your logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-night-muted" aria-hidden />}</div>
            <label className="cursor-pointer rounded-lg border border-night-line px-3 py-2 text-sm hover:bg-night">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(x) => x.target.files?.[0] && uploadLogo(x.target.files[0])} /></label>
            {f.logo_url && <button className="text-xs underline" onClick={() => { set({ logo_url: null }); setLogoPreview(null); }}>Remove</button>}
          </div>
          <p className="-mt-2 text-xs text-night-muted">PNG, JPG, WebP or SVG, up to 2 MB. A wide logo on a transparent background works best.</p>
          <label className="text-sm">"Presented by" (optional)<input className={field} value={f.presented_by ?? ""} maxLength={80} placeholder="Your name or show" onChange={(x) => set({ presented_by: x.target.value || null })} /></label>
          <label className="flex items-center gap-3 text-sm">Accent colour<input type="color" className="h-10 w-16 cursor-pointer rounded" value={f.accent} onChange={(x) => set({ accent: x.target.value })} /><span className="font-mono text-xs">{f.accent}</span></label>
        </div>}
        {step === 2 && <div className="grid gap-4">
          <h2 className="text-xl font-bold">Countries and layout</h2>
          <div className="grid grid-cols-2 gap-3">
            {LAYOUTS.map((l) => <button key={l.id} onClick={() => set({ layout: l.id })} className={`rounded-lg border p-3 text-left ${f.layout === l.id ? "border-electric ring-2 ring-electric" : "border-night-line"}`}>
              <div className={`mb-2 grid h-14 gap-1 ${l.boxes} ${l.id === "portrait" ? "mx-auto w-8" : ""}`}><span className="rounded bg-electric/40" /><span className="rounded bg-night-line" /></div>
              <span className="block text-sm font-semibold">{l.label}</span><span className="text-xs text-night-muted">{l.note}</span></button>)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.all_countries} onChange={(x) => set({ all_countries: x.target.checked })} /> All countries (+£19/month)</label>
          {!f.all_countries && <>
            <p className="text-xs text-night-muted">{f.countries.length} chosen · first country included, +£3/month each extra.</p>
            <div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-night-line p-2 sm:grid-cols-3">
              {ALL.map((c) => <label key={c.code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.countries.includes(c.code)} onChange={() => set({ countries: f.countries.includes(c.code) ? f.countries.filter((x) => x !== c.code) : [...f.countries, c.code] })} />{c.name}</label>)}
            </div>
          </>}
        </div>}
        {step === 3 && <div className="grid gap-3">
          <h2 className="text-xl font-bold">Presenter and sponsors</h2>
          <label className={`flex gap-3 rounded-lg border p-3 text-sm ${f.presenter === "self" ? "border-electric" : "border-night-line"}`}><input type="radio" checked={f.presenter === "self"} onChange={() => set({ presenter: "self" })} /><span><b>Present it yourself</b> — included. A camera window and autocue of the on-screen figure.</span></label>
          <label className={`flex gap-3 rounded-lg border p-3 text-sm ${f.presenter === "ai" ? "border-electric" : "border-night-line"}`}><input type="radio" checked={f.presenter === "ai"} onChange={() => set({ presenter: "ai" })} /><span><b>UKStats AI presenter</b> — +£10/month. Clearly labelled AI, reads only the published figures on screen.</span></label>
          <label className="flex gap-3 rounded-lg border border-night-line p-3 text-sm"><input type="checkbox" checked={!f.show_sponsor_box} onChange={(x) => set({ show_sponsor_box: !x.target.checked })} /><span><b>Remove the UKStats sponsor box</b> — +£49/month.</span></label>
          <p className="text-xs text-night-muted">You control branding only. Every figure keeps its source, period, data age and next release, with a "Data: UKStats" credit.</p>
        </div>}
        {step === 4 && <Plan f={f} data={data} onRequest={async () => { const r = await request(); if ("error" in r) toast.error(r.error); else { toast.success("Activation requested"); qc.invalidateQueries({ queryKey: ["my-rent-channel"] }); } }} />}
        <div className="mt-5 flex justify-between gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          <div className="flex gap-2">
            {step < 4 && <Button variant="outline" disabled={busy || !f.display_name.trim()} onClick={() => persist()}>Save</Button>}
            {step < 4 && <Button disabled={busy || !f.display_name.trim() || (slugState ? !slugState.ok : false)} onClick={next}>{step === 3 ? "Save & choose plan" : "Next"}</Button>}
          </div>
        </div>
      </section>
    </div>

    <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><Tv className="size-5" aria-hidden /> Live preview</h2>
          {savedSlug && <a className="flex items-center gap-1 text-xs underline" href={`/s/${savedSlug}/broadcast?preview=1`} target="_blank" rel="noopener">Full size <ExternalLink className="size-3" aria-hidden /></a>}</div>
        {savedSlug ? <div className={`relative overflow-hidden rounded-xl border border-night-line bg-night ${f.layout === "portrait" ? "mx-auto aspect-[9/16] max-h-[640px]" : "aspect-video"}`}>
          <iframe key={previewKey} title="Your stream preview" src={`/s/${savedSlug}/broadcast?preview=1&voice=off`} className="absolute inset-0 h-full w-full border-0" />
        </div> : <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-night-line text-sm text-night-muted">Save step 1 to see your preview</div>}
        <p className="mt-1 text-xs text-night-muted">Updates each time you save. Shows "Preview — not live" until your channel is active.</p>
      </section>
      {savedSlug && <GoLive slug={savedSlug} live={data.live} self={f.presenter === "self"} portrait={f.layout === "portrait"} />}
      {data.isAdmin && <Link to="/rent/admin" className="block rounded-xl border-2 border-electric p-3 text-sm font-semibold">Admin: review and switch on channels →</Link>}
    </div>
  </div>;
}

function Plan({ f, data, onRequest }: { f: ChannelSettings; data: Awaited<ReturnType<typeof getMyChannel>>; onRequest: () => void }) {
  const plan: RentPlan = useMemo(() => ({ countries: f.all_countries ? 1 : Math.max(1, f.countries.length), allCountries: f.all_countries, ai: f.presenter === "ai", noSponsorBox: !f.show_sponsor_box }), [f]);
  const full = planPence(plan), founding = planPence(plan, true);
  const startCheckout = useServerFn(createRentCheckout), portal = useServerFn(createRentPortal);
  const [open, setOpen] = useState(false);
  let ready = true; try { getStripeEnvironment(); } catch { ready = false; }
  const hasPlan = data.billing?.hasStripe && ["active", "trialing", "past_due"].includes(data.billing.status ?? "");
  const fetchClientSecret = async () => {
    const r = await startCheckout({ data: { plan, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/rent/dashboard?checkout=done` } });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };
  const billing = async () => {
    const w = window.open("", "_blank");
    const r = await portal({ data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/rent/dashboard` } });
    if ("error" in r) { w?.close(); toast.error(r.error); return; }
    if (w) w.location.href = r.url; else window.location.href = r.url;
  };
  const lines = [
    ["Branded stream, 1 country", 900],
    ...(plan.allCountries ? [["All countries", 1900]] : plan.countries > 1 ? [[`${plan.countries - 1} extra ${plan.countries - 1 === 1 ? "country" : "countries"}`, 300 * (plan.countries - 1)]] : []),
    ...(plan.ai ? [["AI presenter", 1000]] : []),
    ...(plan.noSponsorBox ? [["No sponsor box", 4900]] : []),
  ] as [string, number][];
  return <div className="grid gap-4">
    <h2 className="flex items-center gap-2 text-xl font-bold"><CreditCard className="size-5" aria-hidden /> Your plan</h2>
    <div className="rounded-lg border border-night-line">
      {lines.map(([l, p]) => <div key={l} className="flex justify-between border-b border-night-line px-3 py-2 text-sm last:border-0"><span>{l}</span><span className="font-mono">{gbp(p)}</span></div>)}
      <div className="flex items-baseline justify-between bg-night px-3 py-3"><span className="font-bold">Monthly</span><span><s className="mr-2 font-mono text-sm text-night-muted">{gbp(full)}</s><span className="font-mono text-2xl font-black">{gbp(founding)}</span></span></div>
    </div>
    <p className="text-xs text-night-muted">Founding streamer price (25% off) for the first 10 channels, kept for as long as you subscribe. Monthly, cancel any time; access runs to the end of the paid month. Change your choices in steps 3–4.</p>
    {hasPlan ? <Button onClick={billing}>Manage billing</Button>
      : !ready ? <p className="text-sm text-ageing">Checkout isn't switched on for this site yet.</p>
      : open ? <div className="rounded-lg bg-background p-2"><EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider></div>
      : <Button size="lg" onClick={() => setOpen(true)}>Subscribe — {gbp(founding)}/month</Button>}
    {data.billing?.hasStripe && !hasPlan && <Button variant="outline" onClick={billing}>Billing history</Button>}
    {!hasPlan && data.channel && ["draft", "paused"].includes(data.channel.status) && <button className="text-left text-xs underline" onClick={onRequest}>Partner or press? Request activation without paying</button>}
  </div>;
}

function GoLive({ slug, live, self, portrait }: { slug: string; live: boolean; self: boolean; portrait: boolean }) {
  const obs = `https://ukstats.co.uk/s/${slug}/broadcast`, watch = `https://ukstats.co.uk/s/${slug}`;
  const copy = (v: string) => navigator.clipboard.writeText(v).then(() => toast.success("Copied"), () => toast.error("Copy failed"));
  const items = [
    `Add a Browser source in OBS sized ${portrait ? "1080 × 1920" : "1920 × 1080"} and paste your stream link.`,
    'Tick "Control audio via OBS" so the presenter and chime come through.',
    ...(self ? ["Add your camera as a Video Capture source and place it over the dashed camera window."] : []),
    "Do a private or unlisted test stream first, then go public.",
    "Your stream key stays in OBS — never paste it into this site.",
  ];
  return <section className="rounded-xl border border-night-line bg-night-panel p-4">
    <h2 className="flex items-center gap-2 text-lg font-bold"><Radio className="size-5" aria-hidden /> {live ? "Your stream is live" : "Go-live checklist"}</h2>
    <div className="mt-3 grid gap-2 text-sm">
      {[["OBS stream link", obs], ["Public watch page", watch]].map(([l, v]) => <div key={l} className="flex items-center gap-2"><span className="w-32 shrink-0 text-night-muted">{l}</span><code className="min-w-0 flex-1 truncate font-mono text-electric">{v}</code><button aria-label={`Copy ${l}`} onClick={() => copy(v!)} className="rounded p-1 hover:bg-night"><Copy className="size-4" /></button></div>)}
    </div>
    <ul className="mt-3 space-y-1 text-sm">{items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-fresh" aria-hidden />{i}</li>)}</ul>
  </section>;
}
