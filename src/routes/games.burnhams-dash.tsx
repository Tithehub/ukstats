import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/games/burnhams-dash")({
  beforeLoad: () => { throw redirect({ to: "/games/lowes-mission", statusCode: 301 }); },
});
