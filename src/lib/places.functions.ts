import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getPlaces = createServerFn({ method: "POST" }).handler(async () => {
  const { loadPlaces } = await import("./places.server");
  return loadPlaces();
});
export const placesQuery = () => queryOptions({ queryKey: ["places-v1"], queryFn: () => getPlaces(), staleTime: 60 * 60_000 });
