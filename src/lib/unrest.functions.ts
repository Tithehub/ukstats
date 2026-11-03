import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getUnrest = createServerFn({ method: "POST" }).handler(async () => {
  const { loadUnrest } = await import("./unrest.server");
  try { return await loadUnrest(); } catch { return null; }
});

export const unrestQuery = () => queryOptions({ queryKey: ["unrest"], queryFn: () => getUnrest(), staleTime: 10 * 60_000 });
