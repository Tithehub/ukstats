import { describe, expect, it, vi } from "vitest";
import { checkHealthAlertSource, checkVerifiedHealthAlerts, healthAlertMetric, UKHSA_ALERT_URL } from "./health-alerts";
describe("weather-health source checks", () => {
  it("bounds failed checks at two and never assumes an alert level", async () => {
    const read = vi.fn().mockRejectedValue(new Error("offline"));
    const metric = await checkHealthAlertSource(read);
    expect(read).toHaveBeenCalledTimes(2);
    expect(metric.value).toBeNull();
    expect(metric.scale?.current).toBeNull();
    expect(metric.status).toBe("unavailable");
    expect(metric.sourceUrl).toBe(UKHSA_ALERT_URL);
  });
  it("does not mistake explanatory colour text for a live alert", async () => {
    const metric = await checkHealthAlertSource(async () => "Red heat-health alert: example of the scale");
    expect(metric.value).toBeNull();
    expect(metric.scale?.current).toBeNull();
  });
});

describe("verified health alert records", () => {
  const now = new Date("2026-10-21T01:16:00Z");
  const rows = Array.from({ length: 9 }, (_, i) => ({ geography_code: `E1200000${i + 1}`, geography_name: `Region ${i + 1}`, status: i === 6 ? "Amber" : "Green", refresh_date: "2026-10-21T00:00:00Z", period_start: "2026-10-20T00:00:00Z", period_end: "2026-10-22T00:00:00Z" }));
  it("ranks explicit current statuses across all nine regions", () => {
    const m = healthAlertMetric(rows, now);
    expect(m.value).toBe("Amber"); expect(m.scale?.current).toBe(2); expect(m.status).toBe("ok");
  });
  it("never treats old green records as a current all-clear", () => {
    const m = healthAlertMetric(rows.map(r => ({ ...r, status: "Green", refresh_date: "2026-08-18T08:00:00Z" })), now);
    expect(m.value).toBeNull(); expect(m.scale?.current).toBeNull(); expect(m.asOf).toBe("2026-08-18T08:00:00.000Z");
  });
  it("blocks partial regional coverage", () => { expect(healthAlertMetric(rows.slice(1), now).value).toBeNull(); });
  it("blocks expired alert periods", () => { expect(healthAlertMetric(rows.map(r => ({ ...r, period_end: "2026-10-21T01:00:00Z" })), now).value).toBeNull(); });
  it("does not infer an alert from descriptive prose", () => { expect(healthAlertMetric(rows.map(r => ({ ...r, status: "Example Red alert" })), now).value).toBeNull(); });
  it("bounds each failed feed to two attempts", async () => {
    const read = vi.fn().mockRejectedValue(new Error("offline"));
    expect((await checkVerifiedHealthAlerts(read, now)).value).toBeNull();
    expect(read).toHaveBeenCalledTimes(4);
  });
});