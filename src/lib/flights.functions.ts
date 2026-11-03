import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const getFlights = createServerFn({ method: "POST" }).handler(async () => {
  const { loadFlights } = await import("./flights.server");
  try { return await loadFlights(); } catch { return null; }
});

export const flightsQuery = (on: boolean) => queryOptions({
  queryKey: ["flights"], queryFn: () => getFlights(), enabled: on, staleTime: 45_000,
  refetchInterval: on ? 60_000 : false, refetchIntervalInBackground: false,
});
