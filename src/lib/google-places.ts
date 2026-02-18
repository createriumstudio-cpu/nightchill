/**
 * Google Places API サービス
 *
 * 店舗のファクトデータ（名前・住所・営業時間・定休日・緯度経度）を取得する。
 * APIデータは「絶対改変不可のファクト」としてAIプロンプトに注入される。
 *
 * GOOGLE_PLACES_API_KEY が未設定の場合はフォールバックデータを返す。
 */

export interface VenueFactData {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string[] | null;
  isOpenNow: boolean | null;
  phoneNumber: string | null;
  website: string | null;
  types: string[];
  photoReference: string | null;
  source: "google_places" | "fallback";
}

interface PlacesTextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    price_level?: number;
    opening_hours?: { open_now?: boolean };
    types?: string[];
    photos?: Array<{ photo_reference: string }>;
  }>;
  status: string;
}

interface PlaceDetailsResponse {
  result: {
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
      weekday_text?: string[];
      open_now?: boolean;
    };
  };
  status: string;
}

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

function getApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

/**
 * テキスト検索で店舗を検索し、ファクトデータを取得
 */
export async function searchVenue(
  query: string,
  area: string,
): Promise<VenueFactData | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.log("[google-places] API key not set, using fallback");
    return createFallbackVenue(query, area);
  }

  try {
    // Step 1: Text Search
    const searchQuery = `${query} ${area}`;
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.set("query", searchQuery);
    searchUrl.searchParams.set("language", "ja");
    searchUrl.searchParams.set("region", "jp");
    searchUrl.searchParams.set("key", apiKey);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      throw new Error(`Places API search failed: ${searchRes.status}`);
    }

    const searchData = (await searchRes.json()) as PlacesTextSearchResponse;
    if (searchData.status !== "OK" || searchData.results.length === 0) {
      console.warn("[google-places] No results for:", searchQuery);
      return createFallbackVenue(query, area);
    }

    const place = searchData.results[0];

    // Step 2: Place Details (for phone, website, weekday_text)
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.set("place_id", place.place_id);
    detailsUrl.searchParams.set("fields", "formatted_phone_number,website,opening_hours");
    detailsUrl.searchParams.set("language", "ja");
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl.toString());
    let details: PlaceDetailsResponse["result"] = {};
    if (detailsRes.ok) {
      const detailsData = (await detailsRes.json()) as PlaceDetailsResponse;
      if (detailsData.status === "OK") {
        details = detailsData.result;
      }
    }

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating ?? null,
      priceLevel: place.price_level ?? null,
      openingHours: details.opening_hours?.weekday_text ?? null,
      isOpenNow: details.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
      phoneNumber: details.formatted_phone_number ?? null,
      website: details.website ?? null,
      types: place.types ?? [],
      photoReference: place.photos?.[0]?.photo_reference ?? null,
      source: "google_places",
    };
  } catch (error) {
    console.error("[google-places] API error:", error);
    return createFallbackVenue(query, area);
  }
}

/**
 * APIキー未設定時のフォールバック
 * ファクトデータが不明であることを明示する
 */
function createFallbackVenue(name: string, area: string): VenueFactData {
  return {
    placeId: "",
    name,
    address: `${area}（正確な住所はGoogle Places API設定後に取得可能）`,
    lat: 0,
    lng: 0,
    rating: null,
    priceLevel: null,
    openingHours: null,
    isOpenNow: null,
    phoneNumber: null,
    website: null,
    types: [],
    photoReference: null,
    source: "fallback",
  };
}

/**
 * ファクトデータをAIプロンプト用のテキストに変換
 * AIはこのデータを「絶対改変不可」として扱う
 */
export function formatVenueForPrompt(venue: VenueFactData): string {
  const parts: string[] = [];
  parts.push(`【店舗ファクトデータ — 改変厳禁】`);
  parts.push(`店名: ${venue.name}`);
  parts.push(`住所: ${venue.address}`);

  if (venue.openingHours) {
    parts.push(`営業時間:`);
    for (const h of venue.openingHours) {
      parts.push(`  ${h}`);
    }
  }

  if (venue.phoneNumber) {
    parts.push(`電話番号: ${venue.phoneNumber}`);
  }

  if (venue.rating !== null) {
    parts.push(`Google評価: ${venue.rating}/5`);
  }

  if (venue.website) {
    parts.push(`公式サイト: ${venue.website}`);
  }

  if (venue.source === "fallback") {
    parts.push(`※ 上記は仮データです。実際の営業時間等は必ずご自身でご確認ください。`);
  }

  return parts.join("\n");
}
