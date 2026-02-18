import { generateDatePlan } from "../planner";
import type { PlanRequest } from "../types";

describe("generateDatePlan", () => {
  const baseRequest: PlanRequest = {
    occasion: "first-date",
    mood: "romantic",
    budget: "medium",
    location: "渋谷",
    partnerInterests: "カフェ巡り",
    additionalNotes: "",
  };

  it("generates a plan with all required fields", () => {
    const plan = generateDatePlan(baseRequest);

    expect(plan.id).toBeDefined();
    expect(plan.title).toBeDefined();
    expect(plan.summary).toContain("渋谷");
    expect(plan.occasion).toBe("first-date");
    expect(plan.mood).toBe("romantic");
    expect(plan.timeline.length).toBeGreaterThan(0);
    expect(plan.fashionAdvice).toBeDefined();
    expect(plan.conversationTopics.length).toBeGreaterThan(0);
    expect(plan.warnings.length).toBeGreaterThan(0);
  });

  it("includes partner interests in summary when provided", () => {
    const plan = generateDatePlan(baseRequest);
    expect(plan.summary).toContain("カフェ巡り");
  });

  it("handles missing partner interests", () => {
    const plan = generateDatePlan({ ...baseRequest, partnerInterests: "" });
    expect(plan.summary).toBeDefined();
    expect(plan.summary).not.toContain("相手の好み");
  });

  it("generates different timelines for different occasions", () => {
    const firstDate = generateDatePlan({
      ...baseRequest,
      occasion: "first-date",
    });
    const anniversary = generateDatePlan({
      ...baseRequest,
      occasion: "anniversary",
    });

    expect(firstDate.timeline).not.toEqual(anniversary.timeline);
  });

  it("generates unique ids", () => {
    const plan1 = generateDatePlan(baseRequest);
    const plan2 = generateDatePlan(baseRequest);
    expect(plan1.id).not.toBe(plan2.id);
  });

  it("generates plans for all occasion types", () => {
    const occasions = [
      "first-date",
      "anniversary",
      "birthday",
      "proposal",
      "casual",
      "makeup",
    ] as const;

    for (const occasion of occasions) {
      const plan = generateDatePlan({ ...baseRequest, occasion });
      expect(plan.timeline.length).toBeGreaterThan(0);
      expect(plan.conversationTopics.length).toBeGreaterThan(0);
      expect(plan.warnings.length).toBeGreaterThan(0);
    }
  });
});
