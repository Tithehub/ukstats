import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getGold = createServerFn({ method: "POST" }).handler(async () => {
  const { goldReserves } = await import("@/lib/gold.server");
  return goldReserves();
});

export const goldQuery = () => queryOptions({ queryKey: ["gold"], queryFn: () => getGold(), staleTime: 60 * 60_000 });
