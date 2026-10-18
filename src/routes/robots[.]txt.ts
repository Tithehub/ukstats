import { createFileRoute } from "@tanstack/react-router";
import { brandFromHost, SITES } from "@/lib/site-host";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = SITES[brandFromHost(new URL(request.url).host)].origin;
        return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, {
          headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
