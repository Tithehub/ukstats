import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/games/burnhams-dash")({
  beforeLoad: () => { throw redirect({ to: "/games/aim-high-vote-lowe", statusCode: 301 }); },
});
