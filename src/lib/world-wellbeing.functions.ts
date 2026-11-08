import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getWorldWellbeing = createServerFn({ method: "POST" }).handler(async () => {
  const { loadWorldWellbeing } = await import("./world-wellbeing.server");
  return loadWorldWellbeing();
});
export const worldWellbeingQuery = () => queryOptions({ queryKey: ["world-wellbeing-v1"], queryFn: () => getWorldWellbeing(), staleTime: 60 * 60_000 });
