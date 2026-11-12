import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/games/lowes-mission")({
  beforeLoad: () => { throw redirect({ to: "/games/aim-high-vote-lowe", statusCode: 301 }); },
});
