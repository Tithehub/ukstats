import { describe, expect, it } from "vitest";
import { buildRequest, cleanPlan, MAX_TASKS, type PlanTask } from "./planner";

const t = (title: string, why = "helps visitors") => ({ title, why, evidence: "e", size: "small" as const, success_check: "c", needs_user: null });

describe("improvement planner rules", () => {
  it("drops tasks that invent figures, auto-post or resume donations", () => {
    const out = cleanPlan([t("Estimate missing crime figures"), t("Auto-post daily to X"), t("Resume donations on /support"), t("Add share cards")]);
    expect(out.map((x) => x.title)).toEqual(["Add share cards"]);
  });
  it("caps the plan at 10 tasks", () => {
    expect(cleanPlan(Array.from({ length: 15 }, (_, i) => t(`Task ${i}`)))).toHaveLength(MAX_TASKS);
  });
  it("build request includes only approved tasks", () => {
    const tasks: PlanTask[] = [{ ...t("A"), status: "approved" }, { ...t("B"), status: "skipped" }, { ...t("C"), status: "pending" }];
    const msg = buildRequest(tasks);
    expect(msg).toContain("1. A");
    expect(msg).not.toContain("B —");
    expect(msg).not.toContain("C —");
  });
});
