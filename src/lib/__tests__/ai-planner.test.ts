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
    const prompt = buildUserPrompt(baseRequest, [], null, "");
    expect(prompt).toContain("初デート");
    expect(prompt).toContain("ロマンチック");
    expect(prompt).toContain("5,000〜15,000円");
    expect(prompt).toContain("渋谷");
  });

  it("includes partner interests when provided", () => {
    const prompt = buildUserPrompt(baseRequest, [], null, "");
    expect(prompt).toContain("カフェ巡り");
  });

  it("excludes partner interests when empty", () => {
    const prompt = buildUserPrompt({ ...baseRequest, partnerInterests: "" }, [], null, "");
    expect(prompt).not.toContain("趣味・好み");
  });

  it("includes additional notes when provided", () => {
    const prompt = buildUserPrompt(
      { ...baseRequest, additionalNotes: "夜景が見えるところ" },
      [],
      null,
      "",
    );
    expect(prompt).toContain("夜景が見えるところ");
  });

  it("defaults location to 東京 when empty", () => {
    const prompt = buildUserPrompt({ ...baseRequest, location: "" }, [], null, "");
    expect(prompt).toContain("東京");
  });

  it("includes venue fact data when provided", () => {
    const venue = {
      placeId: "test123",
      name: "テスト居酒屋",
      address: "東京都渋谷区1-1-1",
      lat: 35.6,
      lng: 139.7,
      rating: 4.2,
      priceLevel: 2,
      openingHours: ["月曜日: 17:00〜23:00"],
      isOpenNow: true,
      phoneNumber: "03-1234-5678",
      website: null,
      types: ["restaurant"],
      photoReference: null,
      source: "google_places" as const,
    };
    const prompt = buildUserPrompt(baseRequest, [venue], null, "");
    expect(prompt).toContain("テスト居酒屋");
    expect(prompt).toContain("絶対改変不可");
    expect(prompt).toContain("東京都渋谷区1-1-1");
  });

  it("includes walking route when provided", () => {
    const route = {
      durationText: "徒歩8分",
      durationMinutes: 8,
      distanceText: "650m",
      distanceMeters: 650,
      summary: "渋谷駅周辺",
      mapEmbedUrl: null,
      source: "google_maps" as const,
    };
    const prompt = buildUserPrompt(baseRequest, [], route, "");
    expect(prompt).toContain("徒歩8分");
    expect(prompt).toContain("650m");
  });
});
