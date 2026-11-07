import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { FundingLegalNotice } from "@/components/FundingLegalNotice";
import { COUNTRIES } from "@/lib/countries";
import {
  PRODUCT_PRICES, gbp, monthlyPence,
  type Presenter, type RentLayout, type RentProduct,
} from "@/lib/rent-pricing";

export const Route = createFileRoute("/rent")({
  head: () => ({
    meta: [
      { title: "Rent UKStats — brand official statistics as your own" },
      { name: "description", content: "Put verified official statistics under your own logo: widgets, dashboards, a branded live stream with an AI presenter or yourself, and a data API." },
      { property: "og:title", content: "Rent UKStats — brand official statistics as your own" },
      { property: "og:description", content: "Your logo, your layout, your countries — the same verified official figures, sources and dates." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/rent" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/rent" }],
  }),
  component: RentPage,
});

const LAYOUTS: { id: RentLayout; label: string; note: string }[] = [
  { id: "classic", label: "Classic news desk", note: "Presenter left, big figure centre, Top 6 right" },
  { id: "data-wall", label: "Data wall", note: "Bright tiles across the top, presenter in the corner" },
  { id: "split", label: "Split screen", note: "Presenter a third, figures two-thirds" },
  { id: "portrait", label: "Portrait", note: "For phones, Shorts and shop screens" },
];
const PRESENTERS: { id: Presenter; label: string; note: string }[] = [
  { id: "ai", label: "UKStats AI presenter", note: "+£50/month · labelled AI · reads only the figures on screen" },
  { id: "self", label: "Present it yourself", note: "Included · camera slot plus an autocue of the official-figure script" },
  { id: "none", label: "No presenter", note: "Figures and tickers only" },
];

function RentPage() {
  const [products, setProducts] = useState<RentProduct[]>(["stream"]);
  const [layout, setLayout] = useState<RentLayout>("classic");
  const [presenter, setPresenter] = useState<Presenter>("ai");
  const [whole, setWhole] = useState(false);
  const [picked, setPicked] = useState<string[]>(["uk"]);
  const [subdomain, setSubdomain] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", website: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const countryOptions = useMemo(() => [{ code: "uk", name: "United Kingdom" }, ...COUNTRIES.map((c) => ({ code: c.code, name: c.name }))], []);
  const config = { products, countries: picked.length || 1, wholePackage: whole, presenter, subdomain, founding: false };
  const price = monthlyPence(config);
  const founding = monthlyPence({ ...config, founding: true });
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const summary = [
      "[Rent UKStats enquiry]",
      `Products: ${products.map((p) => PRODUCT_PRICES[p].label).join(", ") || "none"}`,
      `Layout: ${layout}`,
      `Presenter: ${presenter}`,
      `Coverage: ${whole ? "Whole package" : picked.join(", ")}`,
      `Own subdomain: ${subdomain ? "yes" : "no"}`,
      `Quoted: ${gbp(price)}/month (founding ${gbp(founding)})`,
      form.message && `Notes: ${form.message}`,
    ].filter(Boolean).join("\n");
    const { error } = await supabase.from("sponsor_enquiries").insert({
      name: form.name.slice(0, 120), email: form.email.slice(0, 200), company: form.company.slice(0, 160),
      website: form.website.slice(0, 300) || null, message: summary.slice(0, 4000), status: "new",
    });
    setState(error ? "error" : "sent");
  }

  const box = "rounded-lg border border-border bg-card p-4";
  const chip = (on: boolean) => `rounded-md border px-3 py-2 text-left text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">White label</p>
        <h1 className="mt-2 text-4xl font-black">Rent UKStats — put official statistics under your own brand</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Your logo, your colours, your layout and your countries. The figures, sources and dates stay exactly as published — you can brand the stats, never change them. Everything on ukstats.co.uk stays free.
        </p>
        <div className="mt-6"><FundingLegalNotice /></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className={box}>
              <h2 className="text-lg font-bold">1. What do you want?</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(Object.keys(PRODUCT_PRICES) as RentProduct[]).map((p) => (
                  <button key={p} type="button" className={chip(products.includes(p))} onClick={() => setProducts(toggle(products, p))}>
                    <span className="font-semibold">{PRODUCT_PRICES[p].label}</span> · {gbp(PRODUCT_PRICES[p].pence)}/month
                  </button>
                ))}
              </div>
              {products.includes("dashboard") && (
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={subdomain} onChange={(e) => setSubdomain(e.target.checked)} />
                  Use my own web address (e.g. stats.yourcompany.com) · +£50/month
                </label>
              )}
            </section>

            <section className={box}>
              <h2 className="text-lg font-bold">2. Choose a layout</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {LAYOUTS.map((l) => (
                  <button key={l.id} type="button" className={chip(layout === l.id)} onClick={() => setLayout(l.id)}>
                    <span className="block font-semibold">{l.label}</span><span className="text-xs opacity-80">{l.note}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">You can show, hide and move panels and set your logo and colours. Source and date labels always stay on screen.</p>
            </section>

            <section className={box}>
              <h2 className="text-lg font-bold">3. Who presents?</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {PRESENTERS.map((p) => (
                  <button key={p.id} type="button" className={chip(presenter === p.id)} onClick={() => setPresenter(p.id)}>
                    <span className="block font-semibold">{p.label}</span><span className="text-xs opacity-80">{p.note}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">If you present yourself, the screen shows "Presented by" your name. What you say is your responsibility; the figures on screen stay official.</p>
            </section>

            <section className={box}>
              <h2 className="text-lg font-bold">4. Which countries?</h2>
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} />
                Whole package — every country and topic · +£399/month
              </label>
              {!whole && (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">One country included, +£25/month for each extra one.</p>
                  <div className="mt-2 flex max-h-56 flex-wrap gap-1 overflow-y-auto">
                    {countryOptions.map((c) => (
                      <button key={c.code} type="button" className={`${chip(picked.includes(c.code))} px-2 py-1 text-xs`} onClick={() => setPicked(toggle(picked, c.code))}>{c.name}</button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className={`${box} h-fit lg:sticky lg:top-4`}>
            <h2 className="text-lg font-bold">Your price</h2>
            <p className="mt-2 text-4xl font-black">{gbp(price)}<span className="text-base font-normal">/month</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Founding offer (first 10 customers): <strong className="text-foreground">{gbp(founding)}/month</strong> for life.</p>
            {state === "sent" ? (
              <p className="mt-4 rounded-md bg-muted p-3 text-sm">Thanks — we've got your choices and will be in touch. Nothing has been charged.</p>
            ) : (
              <form className="mt-4 space-y-2" onSubmit={submit}>
                {(["name", "email", "company", "website"] as const).map((k) => (
                  <input key={k} required={k !== "website"} type={k === "email" ? "email" : "text"} placeholder={k === "website" ? "Website (optional)" : k[0].toUpperCase() + k.slice(1)}
                    value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                ))}
                <textarea placeholder="Anything else?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} />
                <Button type="submit" className="w-full" disabled={state === "sending" || products.length === 0}>
                  {state === "sending" ? "Sending…" : "Reserve my setup"}
                </Button>
                {state === "error" && <p className="text-sm text-destructive">Couldn't send — please try again.</p>}
                <p className="text-xs text-muted-foreground">No payment is taken while payments are paused. Every customer is approved by us; banned sponsor categories apply.</p>
              </form>
            )}
          </aside>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Figures never change", "No editing, hiding or overriding numbers. Missing figures still say \"Not published\"."],
            ["Always sourced", "Source, period, data age and next release stay visible on every branded view."],
            ["Keeps UKStats free", "Rental income pays for the free public site — it never puts stats behind a paywall."],
          ].map(([t, d]) => (
            <div key={t} className={box}><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
          ))}
        </section>
        <p className="mt-6 text-sm">Prefer a simple sponsorship instead? <Link to="/advertise" className="underline">Sponsor UKStats</Link> · <Link to="/sponsors" className="underline">Our sponsors</Link></p>
      </main>
      <SiteFooter />
    </div>
  );
}
