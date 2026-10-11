import { createFileRoute } from "@tanstack/react-router";

// /api on its own forwards to the API docs; /api/* server routes are unaffected.
export const Route = createFileRoute("/api")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const u = new URL(request.url);
        if (u.pathname.replace(/\/$/, "") !== "/api") return new Response("Not found", { status: 404 });
        return Response.redirect(new URL("/api-docs", u).toString(), 301);
      },
    },
  },
});
