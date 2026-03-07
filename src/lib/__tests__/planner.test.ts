import { generateDatePlan } from "../planner";
import type { PlanRequest } from "../types";

const mockRequest: PlanRequest = {
  dateStr: "",
  endDateStr: "",
  startTime: "",
  endTime: "",
  city: "tokyo",
  location: "渋谷",
  relationship: "lover",
  activities: ["dinner", "cafe"],
  mood: "romantic",
  budget: "medium",
  ageGroup: "20-plus",
  additionalNotes: "",
};

describe("generateDatePlan", () => {
  it("should generate a plan with required fields", () => {
    const plan = generateDatePlan(mockRequest);
    expect(plan.id).toBeDefined();
    expect(plan.title).toBeDefined();
    expect(plan.summary).toBeDefined();
    expect(plan.timeline.length).toBeGreaterThan(0);
    expect(plan.fashionAdvice).toBeDefined();
    expect(plan.timeline[0].venue).toBeTruthy();
  });

  it("should include location in plan", () => {
    const plan = generateDatePlan(mockRequest);
    expect(plan.title).toContain("渋谷");
  });

  it("should add warnings for under-20", () => {
    const underageRequest: PlanRequest = {
      ...mockRequest,
      ageGroup: "under-20",
    };
    const plan = generateDatePlan(underageRequest);
    expect(plan.warnings.length).toBeGreaterThan(0);
  });

  it("should use time range when provided", () => {
    const timedRequest: PlanRequest = {
      ...mockRequest,
      startTime: "11:00",
      endTime: "20:00",
    };
    const plan = generateDatePlan(timedRequest);
    expect(plan.timeline.length).toBeGreaterThanOrEqual(4);
  });

  it("should use city name when location is empty", () => {
    const osakaRequest: PlanRequest = {
      ...mockRequest,
      city: "osaka",
      location: "",
    };
    const plan = generateDatePlan(osakaRequest);
    expect(plan.title).toContain("大阪");
  });

  it("should fall back to Tokyo for unknown city", () => {
    const unknownRequest: PlanRequest = {
      ...mockRequest,
      city: "unknown-city",
      location: "",
    };
    const plan = generateDatePlan(unknownRequest);
    expect(plan.title).toContain("東京");
  });

  it("should include bar for nightlife activity with 20-plus", () => {
    const barRequest: PlanRequest = {
      ...mockRequest,
      activities: ["nightlife", "dinner"],
      startTime: "18:00",
      endTime: "23:00",
    };
    const plan = generateDatePlan(barRequest);
    const hasBar = plan.timeline.some(t => t.description === "バー");
    expect(hasBar).toBe(true);
  });

  it("should not include bar for under-20", () => {
    const underageBarRequest: PlanRequest = {
      ...mockRequest,
      activities: ["nightlife", "dinner"],
      startTime: "18:00",
      endTime: "23:00",
      ageGroup: "under-20",
    };
    const plan = generateDatePlan(underageBarRequest);
    const hasBar = plan.timeline.some(t => t.description === "バー");
    expect(hasBar).toBe(false);
  });

  it("should use mood prefix in activity descriptions", () => {
    const romanticRequest: PlanRequest = {
      ...mockRequest,
      mood: "romantic",
    };
    const plan = generateDatePlan(romanticRequest);
    const hasPrefix = plan.timeline.some(t => t.activity.includes("雰囲気抜群の"));
    expect(hasPrefix).toBe(true);
  });

  it("should prioritize dinner for dinner-focused activities", () => {
    const dinnerRequest: PlanRequest = {
      ...mockRequest,
      activities: ["dinner"],
    };
    const plan = generateDatePlan(dinnerRequest);
    const hasDinner = plan.timeline.some(t => t.description === "ディナー");
    expect(hasDinner).toBe(true);
  });

  it("should have duration on all timeline items", () => {
    const plan = generateDatePlan(mockRequest);
    for (const item of plan.timeline) {
      expect(item.duration).toBeTruthy();
    }
  });
});
