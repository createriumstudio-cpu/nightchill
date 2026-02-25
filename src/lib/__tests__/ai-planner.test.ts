import { buildUserPrompt } from "../ai-planner";
import type { PlanRequest } from "../types";
import type { VenueFactData } from "../google-places";

const mockRequest: PlanRequest = {
  dateStr: "2026-03-01",
  startTime: "12:00",
  endTime: "20:00",
  location: "渋谷",
  relationship: "lover",
  activities: ["dinner", "cafe"],
  mood: "romantic",
  budget: "medium",
  ageGroup: "20-plus",
  additionalNotes: "カフェ好き",
};

const mockVenues: VenueFactData[] = [
  {
    placeId: "test-1",
    name: "テストカフェ",
    address: "渋谷区神南1-1-1",
    rating: 4.5,
    priceLevel: 2,
    lat: 35.6612,
    lng: 139.7010,
    openingHours: null,
    isOpenNow: null,
    phoneNumber: null,
    website: null,
    types: ["cafe"],
    photoReference: null,
    photoUrl: null,
    photoHtmlAttribution: null,
    source: "google_places",
    googleMapsUrl: null,
    mapEmbedUrl: null,
  },
];

describe("buildUserPrompt", () => {
  it("should include location in prompt", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("渋谷");
  });

  it("should include activities in prompt", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("ディナー");
    expect(prompt).toContain("カフェ巡り");
  });

  it("should include date info when provided", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("2026-03-01");
    expect(prompt).toContain("12:00");
    expect(prompt).toContain("20:00");
  });

  it("should include venue data when provided", () => {
    const prompt = buildUserPrompt(mockRequest, mockVenues, null, "");
    expect(prompt).toContain("テストカフェ");
    expect(prompt).toContain("★4.5");
  });

  it("should include additional notes", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("カフェ好き");
  });

  it("should include relationship info", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("恋人");
  });

  it("should add winter note for December dates", () => {
    const winterReq: PlanRequest = {
      ...mockRequest,
      dateStr: "2026-12-15",
    };
    const prompt = buildUserPrompt(winterReq, [], null, "");
    expect(prompt).toContain("冬季");
  });
});
