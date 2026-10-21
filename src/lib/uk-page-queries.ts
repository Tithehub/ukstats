import { queryOptions } from "@tanstack/react-query";
import { getMapLayers, getTaxVsWelfare } from "./uk-stats.functions";

/** Repeated visits reuse the published response, without changing its source dates. */
export const mapLayersQuery = () => queryOptions({
  queryKey: ["uk-map-layers"], queryFn: () => getMapLayers(), staleTime: 5 * 60_000,
});
export const taxWelfareQuery = () => queryOptions({
  queryKey: ["uk-tax-welfare"], queryFn: () => getTaxVsWelfare(), staleTime: 5 * 60_000,
});