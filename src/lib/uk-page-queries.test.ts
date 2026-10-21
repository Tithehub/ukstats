import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
vi.mock("./uk-stats.functions", () => ({ getMapLayers: vi.fn(), getTaxVsWelfare: vi.fn() }));
import { getMapLayers, getTaxVsWelfare } from "./uk-stats.functions";
import { mapLayersQuery, taxWelfareQuery } from "./uk-page-queries";

describe("repeat page reads", () => {
  it("reuses map layers on repeat visits", async () => {
    vi.mocked(getMapLayers).mockResolvedValue([]);
    const client = new QueryClient();
    await client.ensureQueryData(mapLayersQuery());
    await client.ensureQueryData(mapLayersQuery());
    expect(getMapLayers).toHaveBeenCalledTimes(1);
    client.clear();
  });
  it("reuses the tax response on repeat visits", async () => {
    vi.mocked(getTaxVsWelfare).mockResolvedValue({ points: [], asOf: null, nextDue: null, lastCompleteYear: null, incomeTaxFrom: null });
    const client = new QueryClient();
    await client.ensureQueryData(taxWelfareQuery());
    await client.ensureQueryData(taxWelfareQuery());
    expect(getTaxVsWelfare).toHaveBeenCalledTimes(1);
    client.clear();
  });
});