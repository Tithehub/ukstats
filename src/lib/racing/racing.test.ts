import { describe, expect, it } from "vitest";
import { competitionPoints, dayWindow, distanceLabel, lastForm, spBonus, weightLabel, winRate } from "./racing";

describe("racing helpers", () => {
  it("win rate always carries its sample size", () => {
    expect(winRate(3, 12).label).toBe("25% (3 from 12 runs)");
    expect(winRate(0, 0).pct).toBeNull();
  });
  it("formats British distances and weights", () => {
    expect(distanceLabel(4400)).toBe("2m4f");
    expect(distanceLabel(1540)).toBe("7f");
    expect(distanceLabel(1870)).toBe("1m110y");
    expect(weightLabel(154)).toBe("11-0");
  });
  it("keeps the last five form figures", () => {
    expect(lastForm("12-3P45F")).toEqual(["3", "P", "4", "5", "F"]);
  });
  it("SP bonus follows MIN(10, MAX(0, ROUND(2 × (SP − 2))))", () => {
    expect(spBonus(1.5)).toBe(0);
    expect(spBonus(4)).toBe(4);
    expect(spBonus(9)).toBe(10);
    expect(spBonus(21)).toBe(10);
  });
  it("scores 10 + bonus for a winner, 0 otherwise, excludes cancelled", () => {
    expect(competitionPoints(true, 5, "ran")).toBe(16);
    expect(competitionPoints(false, 5, "ran")).toBe(0);
    expect(competitionPoints(true, 5, "non_runner")).toBe(0);
    expect(competitionPoints(true, 5, "cancelled")).toBeNull();
  });
  it("today and tomorrow use London dates", () => {
    const now = new Date("2026-11-09T23:30:00Z");
    expect(dayWindow("today", now)).toEqual({ from: "2026-11-09", to: "2026-11-09" });
    expect(dayWindow("tomorrow", now).from).toBe("2026-11-10");
  });
});
