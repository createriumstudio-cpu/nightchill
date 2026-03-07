import { EXCLUDED_TYPES, searchVenue } from "../google-places";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  process.env.GOOGLE_PLACES_API_KEY = "test-key";
  process.env.GOOGLE_MAPS_API_KEY = "test-maps-key";
});

afterEach(() => {
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;
});

function makePlacesResponse(places: Array<{ id: string; name: string; types: string[] }>) {
  return {
    ok: true,
    json: async () => ({
      places: places.map(p => ({
        id: p.id,
        displayName: { text: p.name, languageCode: "ja" },
        formattedAddress: "東京都渋谷区",
        location: { latitude: 35.66, longitude: 139.70 },
        types: p.types,
      })),
    }),
  };
}

describe("EXCLUDED_TYPES", () => {
  it("should include interior_designer in excluded types", () => {
    expect(EXCLUDED_TYPES).toContain("interior_designer");
  });

  it("should include common non-date venue types", () => {
    expect(EXCLUDED_TYPES).toContain("hospital");
    expect(EXCLUDED_TYPES).toContain("dentist");
    expect(EXCLUDED_TYPES).toContain("car_dealer");
    expect(EXCLUDED_TYPES).toContain("funeral_home");
    expect(EXCLUDED_TYPES).toContain("bank");
  });
});

describe("searchVenue - EXCLUDED_TYPES filtering", () => {
  it("should filter out venues with excluded types", async () => {
    mockFetch.mockResolvedValueOnce(
      makePlacesResponse([
        { id: "1", name: "インテリアデザイン会社", types: ["interior_designer"] },
        { id: "2", name: "おしゃれカフェ", types: ["cafe", "food"] },
      ])
    );

    const result = await searchVenue("カフェ", "渋谷", "カフェ");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("おしゃれカフェ");
  });

  it("should return null when all results are excluded types", async () => {
    mockFetch.mockResolvedValueOnce(
      makePlacesResponse([
        { id: "1", name: "歯医者", types: ["dentist"] },
        { id: "2", name: "銀行", types: ["bank"] },
      ])
    );

    const result = await searchVenue("レストラン", "渋谷", "ディナー");
    expect(result).toBeNull();
  });

  it("should fall back to first result when genreHint matching finds no candidates in filtered list", async () => {
    mockFetch.mockResolvedValueOnce(
      makePlacesResponse([
        { id: "1", name: "美容室A", types: ["beauty_salon"] },
        { id: "2", name: "美容室B", types: ["beauty_salon"] },
      ])
    );

    const result = await searchVenue("レストラン", "渋谷", "ディナー");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("美容室A");
  });

  it("should fall back to first result when single result does not match genreHint", async () => {
    mockFetch.mockResolvedValueOnce(
      makePlacesResponse([
        { id: "1", name: "美容室", types: ["beauty_salon"] },
      ])
    );

    const result = await searchVenue("レストラン", "渋谷", "ディナー");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("美容室");
  });

  it("should return first filtered result when no genreHint is provided", async () => {
    mockFetch.mockResolvedValueOnce(
      makePlacesResponse([
        { id: "1", name: "良いお店", types: ["restaurant"] },
      ])
    );

    const result = await searchVenue("良いお店", "渋谷");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("良いお店");
  });
});
