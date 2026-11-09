import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { racingVisible } from "@/lib/racing/visibility";

const host = createIsomorphicFn()
  .server(() => { try { return new URL(getRequest().url).host; } catch { return ""; } })
  .client(() => window.location.host);

/** Gate: racing pages exist only in previews until RACING_PUBLIC is switched on. */
export const Route = createFileRoute("/racing")({
  beforeLoad: () => { if (!racingVisible(host())) throw notFound(); },
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Outlet />,
});
