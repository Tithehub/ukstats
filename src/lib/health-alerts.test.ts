import { describe, expect, it, vi } from "vitest";
import { checkHealthAlertSource, UKHSA_ALERT_URL } from "./health-alerts";
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