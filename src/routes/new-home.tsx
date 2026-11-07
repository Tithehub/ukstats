import { createFileRoute, redirect } from "@tanstack/react-router";
import { WORLD_INDICATORS } from "@/lib/world";

export const Route = createFileRoute("/new-home")({
  validateSearch: (s: Record<string, unknown>): { c?: string | undefined; ind?: string | undefined } => ({
    c: typeof s["c"] === "string" ? s["c"].slice(0, 80) : undefined,
    ind: WORLD_INDICATORS.some((i) => i.slug === s["ind"]) ? String(s["ind"]) : undefined,
  }),
  beforeLoad: ({ search, location }) => { throw redirect({ to: "/", search, hash: location.hash, statusCode: 301 }); },
  head: () => ({
    meta: [
      { title: "UKStats — official statistics homepage" },
      { name: "description", content: "The UKStats homepage has moved to the main address. Free official UK figures, warnings and the interactive globe." },
      { property: "og:title", content: "UKStats — official statistics homepage" },
      { property: "og:description", content: "Free official UK figures, warnings and the interactive globe at the main UKStats address." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/" }],
  }),
});
