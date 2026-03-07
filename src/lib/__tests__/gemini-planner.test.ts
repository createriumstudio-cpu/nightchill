// gemini-planner.ts の基本テスト
// GoogleGenerativeAI をモックして generateGeminiPlan の動作を確認

jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        title: "渋谷カフェ巡りデート",
        summary: "恋人と渋谷でカフェ巡りを楽しむプランです。",
        timeline: [
          { time: "12:00", duration: "60分", activity: "ランチ", venue: "AFURI 恵比寿", description: "ラーメン", tip: "早めに到着" },
          { time: "14:00", duration: "45分", activity: "カフェ", venue: "猿田彦珈琲", description: "カフェ", tip: "人気店" },
        ],
      }),
    },
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

jest.mock("../google-places", () => ({
  searchVenue: jest.fn().mockResolvedValue({
    placeId: "test-1",
    name: "AFURI 恵比寿",
    address: "渋谷区恵比寿1-1-1",
    rating: 4.2,
    priceLevel: 2,
    lat: 35.6464,
    lng: 139.7100,
    openingHours: null,
    isOpenNow: null,
    phoneNumber: null,
    website: null,
    types: ["restaurant"],
    photoReference: null,
    photoUrl: null,
    photoHtmlAttribution: null,
    source: "google_places",
    googleMapsUrl: null,
    mapEmbedUrl: null,
  }),
  searchAreaVenues: jest.fn().mockResolvedValue([]),
}));

jest.mock("../google-maps", () => ({
  getWalkingRoute: jest.fn().mockResolvedValue(null),
}));

jest.mock("../contextual-pr", () => ({
  findRelevantPR: jest.fn().mockReturnValue([]),
  formatPRForPrompt: jest.fn().mockReturnValue(""),
}));

jest.mock("../env", () => ({
  env: jest.fn().mockReturnValue({
    GEMINI_API_KEY: "test-gemini-key",
    GEMINI_MODEL: "gemini-2.0-flash",
    ANTHROPIC_API_KEY: "test-key",
    ANTHROPIC_MODEL: "claude-sonnet-4-6",
  }),
}));

import { generateGeminiPlan } from "../gemini-planner";
import type { PlanRequest } from "../types";

const mockRequest: PlanRequest = {
  dateStr: "2026-03-01",
  endDateStr: "",
  startTime: "12:00",
  endTime: "20:00",
  city: "tokyo",
  location: "渋谷",
  relationship: "lover",
  activities: ["dinner", "cafe"],
  mood: "romantic",
  budget: "medium",
  ageGroup: "20-plus",
  additionalNotes: "",
};

describe("generateGeminiPlan", () => {
  it("should generate a plan with required fields", async () => {
    const plan = await generateGeminiPlan(mockRequest);
    expect(plan.id).toBeDefined();
    expect(plan.title).toBe("渋谷カフェ巡りデート");
    expect(plan.summary).toBeDefined();
    expect(plan.timeline.length).toBe(2);
    expect(plan.venues).toBeDefined();
    expect(plan.venues!.length).toBeGreaterThan(0);
  });

  it("should include venue data from Google Places", async () => {
    const plan = await generateGeminiPlan(mockRequest);
    const venue = plan.venues![0];
    expect(venue.source).toBe("google_places");
    expect(venue.name).toBe("AFURI 恵比寿");
  });
});
