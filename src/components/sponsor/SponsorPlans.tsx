import { COUNTRIES } from "@/lib/countries";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useAuth } from "@/lib/useAuth";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import {
  createSponsorCheckout,
  createSponsorPortal,
  getMySponsorship,
  saveSponsorDetails,
} from "@/lib/sponsor.functions";
import type { SponsorPriceId } from "@/lib/sponsor-plans";

const PLANS = [
  { key: "supporter", name: "Supporter", monthly: 5, yearly: 50, perks: ["Your name and link in the footer “Supported by” line on every page", "Listed on this page as a supporter"] },
  { key: "sponsor", name: "Sponsor", monthly: 10, yearly: 100, perks: ["Everything in Supporter", "A short tagline next to your name", "Shown first in the rotation"] },
] as const;

function Checkout({ priceId, onClose }: { priceId: SponsorPriceId; onClose: () => void }) {
  const start = useServerFn(createSponsorCheckout);
  const fetchClientSecret = async () => {
    const r = await start({
      data: {
        priceId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/advertise?checkout=done&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in r) throw new Error(r.error);
    return r.clientSecret;
  };
  return (
    <div className="mt-6 rounded-xl border border-night-line bg-background p-2">
      <div className="flex justify-end p-2">
        <button type="button" onClick={onClose} className="text-sm text-night-muted hover:text-electric-soft">Close</button>
      </div>
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

function MySponsorship() {
  const load = useServerFn(getMySponsorship);
  const save = useServerFn(saveSponsorDetails);
  const portal = useServerFn(createSponsorPortal);
  const [data, setData] = useState<Awaited<ReturnType<typeof load>> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const refresh = () => load({ data: { environment: getStripeEnvironment() } }).then(setData).catch(() => {});
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    const stop = setTimeout(() => clearInterval(t), 30000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, []);
  if (!data?.sub) return null;
  const s = data.sponsor;
  const status = !s ? "Setting up…" : !s.paid ? "Not showing — subscription ended" : s.approved ? "Live on the site" : s.name === "Pending details" ? "Add your details below" : "Waiting for approval";
  return (
    <section className="mt-8 rounded-xl border border-electric/40 bg-night-panel/60 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Your sponsorship</p>
      <p className="mt-1 text-sm">Plan: <strong>{data.sub.price_id.replace("_", " ")}</strong> · Status: <strong>{status}</strong></p>
      {s ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              const r = await save({ data: { environment: getStripeEnvironment(), name: String(f.get("name")), url: String(f.get("url")), tagline: String(f.get("tagline") ?? ""), region: String(f.get("region") ?? "all"), banner_url: String(f.get("banner_url") ?? "") } });
              setMsg("error" in r ? r.error ?? "Couldn't save" : "Saved — we'll check it and switch it on.");
              refresh();
            } catch (err) { setMsg(err instanceof Error ? err.message : "Couldn't save"); }
          }}
        >
          <label className="text-sm">Name shown<input name="name" required maxLength={80} defaultValue={s.name === "Pending details" ? "" : s.name} className="mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2" /></label>
          <label className="text-sm">Link (https://)<input name="url" required maxLength={300} defaultValue={s.name === "Pending details" ? "" : s.url} className="mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2" /></label>
          <label className="text-sm sm:col-span-2">Where to feature you
            <select name="region" defaultValue={(s as { region?: string }).region ?? "all"} className="mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2">
              <option value="all">Every page (site-wide)</option>
              <option value="uk">United Kingdom pages</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} pages</option>)}
            </select>
          </label>
          {s.plan === "sponsor" ? (
            <><label className="text-sm sm:col-span-2">Banner image link (https://, 1536×512 or 3:1 wide)<input name="banner_url" maxLength={500} defaultValue={(s as { banner_url?: string | null }).banner_url ?? ""} className="mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2" /></label>
            <label className="text-sm sm:col-span-2">Tagline (up to 80 characters)<input name="tagline" maxLength={80} defaultValue={s.tagline ?? ""} className="mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2" /></label></>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button className="rounded-md bg-electric px-4 py-2 text-sm font-medium text-night">Save details</button>
            <button
              type="button"
              className="rounded-md border border-night-line px-4 py-2 text-sm"
              onClick={async () => {
                const r = await portal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
                if ("error" in r) setMsg(r.error); else window.open(r.url, "_blank");
              }}
            >
              Manage subscription
            </button>
            {msg ? <span className="text-sm text-night-muted">{msg}</span> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function SponsorPlans() {
  const { signedIn, loading } = useAuth();
  const [yearly, setYearly] = useState(true);
  const [priceId, setPriceId] = useState<SponsorPriceId | null>(null);
  let ready = true;
  try { getStripeEnvironment(); } catch { ready = false; }

  return (
    <div>
      <div className="mt-4 inline-flex rounded-lg border border-night-line p-1 text-sm" role="group" aria-label="Billing period">
        {[["Monthly", false], ["Yearly — 2 months free", true]].map(([l, v]) => (
          <button key={String(l)} type="button" aria-pressed={yearly === v} onClick={() => setYearly(v as boolean)} className={`rounded-md px-3 py-1.5 ${yearly === v ? "bg-electric text-night" : "text-night-muted"}`}>{l as string}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => {
          const id = `${p.key}_${yearly ? "yearly" : "monthly"}` as SponsorPriceId;
          return (
            <li key={p.key} className="flex flex-col rounded-xl border border-night-line bg-night-panel/50 p-5">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-semibold">£{yearly ? p.yearly : p.monthly}<span className="text-sm font-normal text-night-muted">/{yearly ? "year" : "month"}</span></p>
              <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm text-night-muted">{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              {loading ? null : !signedIn ? (
                <Link to="/auth" className="mt-4 rounded-md border border-electric px-4 py-2 text-center text-sm text-electric-soft">Sign in to choose {p.name}</Link>
              ) : (
                <button type="button" disabled={!ready} onClick={() => setPriceId(id)} className="mt-4 rounded-md bg-electric px-4 py-2 text-sm font-medium text-night disabled:opacity-50">Choose {p.name}</button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-night-muted">Cancel any time. Your line is checked against the rules before it appears.</p>
      {priceId ? <Checkout key={priceId} priceId={priceId} onClose={() => setPriceId(null)} /> : null}
      {signedIn ? <MySponsorship /> : null}
    </div>
  );
}
