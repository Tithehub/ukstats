import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { SponsorPlans } from "@/components/sponsor/SponsorPlans";
import { SponsorPreview } from "@/components/sponsor/SponsorPreview";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Sponsor UKStats — support free official statistics" },
      {
        name: "description",
        content:
          "Sponsor UKStats with a clearly labelled text placement. Sponsors never appear beside figures and never see or influence the data.",
      },
      { property: "og:title", content: "Sponsor UKStats" },
      { property: "og:description", content: "Keep official statistics free. Clearly labelled sponsorship, never beside a figure." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/advertise" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/advertise" }],
  }),
  component: AdvertisePage,
});


const RULES = [
  "Sponsors never appear on a figure card, an embed widget or a share image.",
  "Sponsors never see figures early and have no say over what we publish.",
  "Text and logo only — no tracking scripts, pop-ups or autoplay.",
  "We don't accept political parties, campaign groups, gambling or payday lenders.",
  "We can end a sponsorship at any time if these rules are broken.",
];

function AdvertisePage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    setState("sending");
    const { error } = await supabase.from("sponsor_enquiries").insert({
      name: v("name").slice(0, 200),
      email: v("email").slice(0, 320),
      company: v("company").slice(0, 200),
      website: v("website").slice(0, 500) || null,
      message: v("message").slice(0, 2000) || null,
    });
    setState(error ? "error" : "sent");
  }

  const field = "mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2 text-sm";
  return (
    <div className="min-h-screen bg-night text-foreground">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Sponsorship</p>
        <h1 className="mt-2 text-3xl font-semibold">Keep official statistics free</h1>
        <p className="mt-3 text-night-muted">
          UKStats is free, open source and ad-free next to every figure. Sponsors help pay for the servers and data checks
          — in clearly labelled places that never touch the numbers.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Choose a plan</h2>
        <Button asChild variant="outline" className="mt-3"><Link to="/sponsor-dashboard">Manage my sponsorship</Link></Button>
        <SponsorPlans />
        <SponsorPreview />

        <h2 className="mt-10 text-lg font-semibold">The rules</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-night-muted">
          {RULES.map((r) => <li key={r}>{r}</li>)}
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Something bigger? Enquire</h2>
        {state === "sent" ? (
          <p className="mt-3 rounded-md border border-fresh/40 bg-fresh/10 p-4 text-sm">Thanks — we'll be in touch.</p>
        ) : (
          <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Your name<input name="name" required maxLength={200} className={field} /></label>
            <label className="text-sm">Email<input name="email" type="email" required maxLength={320} className={field} /></label>
            <label className="text-sm">Organisation<input name="company" required maxLength={200} className={field} /></label>
            <label className="text-sm">Website<input name="website" type="url" maxLength={500} className={field} /></label>
            <label className="text-sm sm:col-span-2">Message<textarea name="message" rows={4} maxLength={2000} className={field} /></label>
            <div className="sm:col-span-2">
              <button disabled={state === "sending"} className="rounded-md bg-electric px-4 py-2 text-sm font-medium text-night disabled:opacity-60">
                {state === "sending" ? "Sending…" : "Send enquiry"}
              </button>
              {state === "error" && <span className="ml-3 text-sm text-overdue">Couldn't send — please try again.</span>}
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
