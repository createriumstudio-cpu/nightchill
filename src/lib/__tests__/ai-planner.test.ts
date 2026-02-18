import { buildUserPrompt } from "../ai-planner";
import type { PlanRequest } from "../types";

describe("buildUserPrompt", () => {
  const baseRequest: PlanRequest = {
    occasion: "first-date",
    mood: "romantic",
    budget: "medium",
    location: "渋谷",
    partnerInterests: "カフェ巡り",
    additionalNotes: "",
  };

  it("includes all required fields", () => {
    const prompt = buildUserPrompt(baseRequest);
    expect(prompt).toContain("初デート");
    expect(prompt).toContain("ロマンチック");
    expect(prompt).toContain("5,000〜15,000円");
    expect(prompt).toContain("渋谷");
  });

  it("includes partner interests when provided", () => {
    const prompt = buildUserPrompt(baseRequest);
    expect(prompt).toContain("カフェ巡り");
  });

  it("excludes partner interests when empty", () => {
    const prompt = buildUserPrompt({ ...baseRequest, partnerInterests: "" });
    expect(prompt).not.toContain("趣味・好み");
  });

  it("includes additional notes when provided", () => {
    const prompt = buildUserPrompt({
      ...baseRequest,
      additionalNotes: "夜景が見えるところ",
    });
    expect(prompt).toContain("夜景が見えるところ");
  });

  it("defaults location to 東京 when empty", () => {
    const prompt = buildUserPrompt({ ...baseRequest, location: "" });
    expect(prompt).toContain("東京");
  });
});
