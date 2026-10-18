import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getSmallBoats = createServerFn({ method: "POST" }).handler(async () => {
  const { loadSmallBoats } = await import("./small-boats.server");
  try {
    return await loadSmallBoats();
  } catch {
    return null;
  }
});

export const smallBoatsQuery = () =>
  queryOptions({ queryKey: ["small-boats"], queryFn: () => getSmallBoats(), staleTime: 30 * 60_000 });
