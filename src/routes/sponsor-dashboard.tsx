import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MySponsorship } from "@/components/sponsor/SponsorPlans";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/sponsor-dashboard")({
  head: () => ({ meta: [
    { title: "My sponsor dashboard — UKStats" },
    { name: "description", content: "Manage your UKStats sponsorship: upload a banner and update your sponsor name and website." },
    { property: "og:title", content: "My sponsor dashboard — UKStats" },
    { property: "og:description", content: "Manage your own sponsor banner, name and website on UKStats." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const { signedIn, loading } = useAuth();
  const [environment, setEnvironment] = useState<"live" | "sandbox">("live");
  return <div className="min-h-screen bg-night text-night-fg">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase text-electric">Your account</p>
      <h1 className="mt-2 text-3xl font-semibold">Sponsor dashboard</h1>
      {loading ? <p className="mt-8 text-night-muted">Loading…</p> : !signedIn ?
        <Button asChild className="mt-6"><Link to="/auth">Sign in to manage your sponsorship</Link></Button> : <>
          <label className="mt-6 flex items-center gap-3 text-sm">Sponsorship
            <select aria-label="Sponsorship environment" value={environment} onChange={(e) => setEnvironment(e.target.value === "sandbox" ? "sandbox" : "live")} className="rounded-md border border-night-line bg-night-panel px-3 py-2">
              <option value="live">Live site</option><option value="sandbox">Test payments</option>
            </select>
          </label>
          <MySponsorship key={environment} environment={environment} />
        </>}
    </main>
    <SiteFooter />
  </div>;
}