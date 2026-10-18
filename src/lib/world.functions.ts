import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getWorld = createServerFn({ method: "POST" }).handler(async () => {
  const { loadWorld } = await import("./world.server");
  try {
    return await loadWorld();
  } catch {
    return null;
  }
});

export const worldQuery = () => queryOptions({ queryKey: ["world-bank"], queryFn: () => getWorld(), staleTime: 60 * 60_000 });
