import { buildUserPrompt } from "../ai-planner";
import type { PlanRequest } from "../types";
import type { VenueFactData } from "../google-places";

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
    expect(prompt).toContain("カフェ");
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
    endDateStr: "",
    };
    const prompt = buildUserPrompt(winterReq, [], null, "");
    expect(prompt).toContain("冬");
  });

  it("should include duration alignment instruction when time range is set", () => {
    const prompt = buildUserPrompt(mockRequest, [], null, "");
    expect(prompt).toContain("滞在時間");
  });

  it("should warn about museum closures on Monday", () => {
    const mondayReq: PlanRequest = {
      ...mockRequest,
      dateStr: "2026-03-02", // Monday
    };
    const prompt = buildUserPrompt(mondayReq, [], null, "");
    expect(prompt).toContain("月曜日");
    expect(prompt).toContain("美術館");
  });

  it("should warn about morning start and restaurant availability", () => {
    const morningReq: PlanRequest = {
      ...mockRequest,
      startTime: "09:00",
      endTime: "17:00",
    };
    const prompt = buildUserPrompt(morningReq, [], null, "");
    expect(prompt).toContain("午前スタート");
  });

  it("should warn about afternoon restaurant break time", () => {
    const afternoonReq: PlanRequest = {
      ...mockRequest,
      startTime: "15:00",
      endTime: "21:00",
    };
    const prompt = buildUserPrompt(afternoonReq, [], null, "");
    expect(prompt).toContain("午後スタート");
    expect(prompt).toContain("中休み");
  });

  it("should warn about late night last orders", () => {
    const lateReq: PlanRequest = {
      ...mockRequest,
      startTime: "18:00",
      endTime: "23:00",
    };
    const prompt = buildUserPrompt(lateReq, [], null, "");
    expect(prompt).toContain("夜遅くまで");
  });

  it("should correctly calculate duration for midnight-crossing times (17:00-3:00 = 10 hours)", () => {
    const midnightReq: PlanRequest = {
      ...mockRequest,
      startTime: "17:00",
      endTime: "03:00",
    };
    const prompt = buildUserPrompt(midnightReq, [], null, "");
    expect(prompt).toContain("約10時間");
    expect(prompt).not.toContain("約-14時間");
  });

  it("should warn about late night for endTime before 6:00 (midnight-crossing)", () => {
    const midnightReq: PlanRequest = {
      ...mockRequest,
      startTime: "20:00",
      endTime: "02:00",
    };
    const prompt = buildUserPrompt(midnightReq, [], null, "");
    expect(prompt).toContain("夜遅くまで");
  });

  it("should suggest correct spot count for midnight-crossing duration", () => {
    const midnightReq: PlanRequest = {
      ...mockRequest,
      startTime: "17:00",
      endTime: "03:00",
    };
    const prompt = buildUserPrompt(midnightReq, [], null, "");
    // 10 hours = 8+ spots
    expect(prompt).toContain("8スポット以上");
  });

  it("should indicate no-hotel for day trips (no endDateStr)", () => {
    const dayTripReq: PlanRequest = {
      ...mockRequest,
      endDateStr: "",
    };
    const prompt = buildUserPrompt(dayTripReq, [], null, "");
    expect(prompt).toContain("宿泊プランではありません");
  });

  it("should NOT include no-hotel message for overnight plans", () => {
    const overnightReq: PlanRequest = {
      ...mockRequest,
      dateStr: "2026-03-01",
      endDateStr: "2026-03-02",
    };
    const prompt = buildUserPrompt(overnightReq, [], null, "");
    expect(prompt).not.toContain("宿泊プランではありません");
    expect(prompt).toContain("宿泊プラン");
  });

  it("should include city name in prompt for non-Tokyo cities", () => {
    const osakaReq: PlanRequest = {
      ...mockRequest,
      city: "osaka",
      location: "梅田",
    };
    const prompt = buildUserPrompt(osakaReq, [], null, "");
    expect(prompt).toContain("都市：大阪");
    expect(prompt).toContain("梅田");
  });

  it("should default to Tokyo when city is not specified", () => {
    const noCityReq: PlanRequest = {
      ...mockRequest,
      city: "",
      location: "",
    };
    const prompt = buildUserPrompt(noCityReq, [], null, "");
    expect(prompt).toContain("都市：東京");
  });
});
