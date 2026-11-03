import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getMigrationFlows = createServerFn({ method: "POST" }).handler(async () => {
  const { loadMigrationFlows } = await import("./migration-flows.server");
  try { return await loadMigrationFlows(); } catch { return null; }
});

export const migrationFlowsQuery = (on: boolean) => queryOptions({
  queryKey: ["migration-flows"], queryFn: () => getMigrationFlows(), enabled: on, staleTime: 60 * 60_000,
});
