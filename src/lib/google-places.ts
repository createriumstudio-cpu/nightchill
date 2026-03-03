/**
 * Google Places API (New) サービス
 *
 * 店舗のファクトデータ（名前・住所・営業時間・定休日・緯度経度）を取得する。
 * APIデータは「絶対改変不可のファクト」としてAIプロンプトに注入される。
 *
 * Places API (New) — places.googleapis.com/v1 を使用。
 * 1回のリクエストで全フィールドを取得（旧APIの2段階呼び出しを廃止）。
 * 写真はCDN URLに解決し、APIキーをクライアントに露出させない。
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
  photoUrl: string | null;
  photoHtmlAttribution: string | null;
  source: "google_places" | "fallback";
  googleMapsUrl: string | null;
  mapEmbedUrl: string | null;
}

// ============================================================
// Places API (New) 型定義
// ============================================================

interface PlacesNewSearchResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    rating?: number;
    priceLevel?: string;
    regularOpeningHours?: {
      weekdayDescriptions?: string[];
      openNow?: boolean;
    };
    nationalPhoneNumber?: string;
    websiteUri?: string;
    types?: string[];
    photos?: Array<{
      name: string;
      authorAttributions?: Array<{
        displayName: string;
        uri: string;
      }>;
    }>;
    googleMapsUri?: string;
  }>;
}

interface PhotoMediaResponse {
  photoUri?: string;
}

// ============================================================
// 定数
// ============================================================

const PLACES_API_BASE = "https://places.googleapis.com/v1";

/** 1リクエストで取得する全フィールド */
const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.priceLevel",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.types",
  "places.photos",
  "places.googleMapsUri",
].join(",");

/** priceLevel 文字列 → 数値変換 */
const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** デートプランに不適切な施設タイプ（検索結果から除外） */
export const EXCLUDED_TYPES = [
  "car_dealer", "car_rental", "car_repair", "car_wash",
  "rest_stop", "accounting", "atm", "bank", "consulting_firm",
  "electric_vehicle_charging_station", "gas_station", "parking",
  "financial_planner", "insurance_agency", "lawyer",
  "real_estate_agent", "tax_advisor", "dentist", "doctor",
  "hospital", "medical_lab", "pharmacy", "physiotherapist",
  "auto_parts_store", "cell_phone_store", "convenience_store",
  "department_store", "discount_store", "electronics_store",
  "furniture_store", "hardware_store", "home_improvement_store",
  "wholesaler", "funeral_home", "interior_designer",
  "locksmith", "moving_company", "painter", "plumber",
  "roofing_contractor", "storage", "tailor",
  "telecommunications_service_provider", "travel_agency",
  "veterinary_care", "school", "university", "post_office",
  "police", "fire_station", "courthouse", "city_hall",
  "embassy", "political_leader",
];

/** genreHint キーワード → Google Places types マッピング */
const GENRE_TYPE_MAP: Array<{ keywords: RegExp; types: string[] }> = [
  { keywords: /restaurant|dinner|ディナー|ランチ|食事|イタリアン|フレンチ|和食|中華|寿司|焼肉/i, types: ["restaurant", "meal_takeaway", "food"] },
  { keywords: /cafe|カフェ|コーヒー|喫茶/i, types: ["cafe", "coffee_shop"] },
  { keywords: /bar|バー|居酒屋/i, types: ["bar", "night_club"] },
  { keywords: /museum|美術館|アート|ギャラリー/i, types: ["museum", "art_gallery"] },
  { keywords: /park|公園|散歩/i, types: ["park"] },
  { keywords: /shop|ショッピング|買い物/i, types: ["store", "shopping_mall"] },
];

// ============================================================
// API キー取得
// ============================================================

function getPlacesApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

function getMapsApiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

// ============================================================
// 写真CDN URL解決
// ============================================================

/**
 * 写真リソース名からCDN URLを取得する。
 * skipHttpRedirect=true で直接URLを返させる。
 */
async function resolvePhotoUrl(
  photoName: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${PLACES_API_BASE}/${photoName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PhotoMediaResponse;
    return data.photoUri ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// メイン検索関数
// ============================================================

/**
 * テキスト検索で店舗を検索し、ファクトデータを取得。
 * Places API (New) を使用: 1回のリクエストで全情報を取得。
 */
export async function searchVenue(
  query: string,
  area: string,
  genreHint?: string,
): Promise<VenueFactData | null> {
  const apiKey = getPlacesApiKey();

  if (!apiKey) {
    console.log("[google-places] API key not set, using fallback");
    return createFallbackVenue(query, area);
  }

  try {
    const searchRes = await fetch(`${PLACES_API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${query} ${area}`,
        languageCode: "ja",
        maxResultCount: 3,
      }),
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error(`[google-places] Search failed ${searchRes.status}: ${errText}`);
      return createFallbackVenue(query, area);
    }

    const data = (await searchRes.json()) as PlacesNewSearchResponse;
    const places = data.places;

    if (!places || places.length === 0) {
      console.warn("[google-places] No results for:", query);
      return createFallbackVenue(query, area);
    }

    // EXCLUDED_TYPES に該当する施設を除外
    const filtered = places.filter(p => {
      const types = p.types ?? [];
      return !types.some(t => EXCLUDED_TYPES.includes(t));
    });

    if (filtered.length === 0) {
      console.warn(`[google-places] All results excluded for "${query}"`);
      return null;
    }

    // genreHint がある場合、ジャンルマッチングで最適な結果を選択
    let place = filtered[0];
    if (genreHint && filtered.length >= 1) {
      const matchedEntry = GENRE_TYPE_MAP.find(entry => entry.keywords.test(genreHint));
      if (matchedEntry) {
        const matched = filtered.find(p =>
          p.types?.some(t => matchedEntry.types.includes(t))
        );
        if (matched) {
          console.log(`[google-places] Genre match for "${query}" hint="${genreHint}": selected "${matched.displayName?.text}"`);
          place = matched;
        } else {
          console.warn(`[google-places] No genre match for "${query}" hint="${genreHint}", returning null`);
          return null;
        }
      }
    }

    // 写真CDN URL解決（APIキーをクライアントに露出させない）
    let photoUrl: string | null = null;
    let photoReference: string | null = null;
    let photoAttribution: string | null = null;

    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0];
      photoReference = photo.name;
      photoUrl = await resolvePhotoUrl(photo.name, apiKey);

      const author = photo.authorAttributions?.[0];
      if (author) {
        photoAttribution = author.uri
          ? `<a href="${author.uri}" target="_blank" rel="noopener noreferrer">${author.displayName}</a>`
          : author.displayName;
      }
    }

    // mapEmbedUrl は Maps Embed API なので GOOGLE_MAPS_API_KEY を使用
    const mapsKey = getMapsApiKey();
    const mapEmbedUrl = mapsKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=place_id:${place.id}`
      : null;

    return {
      placeId: place.id,
      name: place.displayName?.text ?? query,
      address: place.formattedAddress ?? `${area}`,
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
      rating: place.rating ?? null,
      priceLevel: place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
      openingHours: place.regularOpeningHours?.weekdayDescriptions ?? null,
      isOpenNow: place.regularOpeningHours?.openNow ?? null,
      phoneNumber: place.nationalPhoneNumber ?? null,
      website: place.websiteUri ?? null,
      types: place.types ?? [],
      photoReference,
      photoUrl,
      photoHtmlAttribution: photoAttribution,
      source: "google_places",
      googleMapsUrl: place.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      mapEmbedUrl,
    };
  } catch (error) {
    console.error("[google-places] API error:", error);
    return createFallbackVenue(query, area);
  }
}

// ============================================================
// フォールバック
// ============================================================

/**
 * APIキー未設定時のフォールバック。
 * ファクトデータが不明であることを明示する。
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
    photoUrl: null,
    photoHtmlAttribution: null,
    source: "fallback",
    googleMapsUrl: null,
    mapEmbedUrl: null,
  };
}

// ============================================================
// エリア事前検索（AIプロンプト注入用）
// ============================================================

/** 事前検索用フィールドマスク（営業時間を含む） */
const PRE_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.priceLevel",
  "places.regularOpeningHours",
  "places.types",
  "places.photos",
  "places.googleMapsUri",
].join(",");

/** アクティビティ → 検索クエリ マッピング */
const ACTIVITY_SEARCH_QUERIES: Record<string, string> = {
  dinner: "レストラン ディナー",
  lunch: "ランチ レストラン",
  cafe: "カフェ",
  shopping: "ショッピング",
  active: "アクティビティ 体験",
  nightlife: "バー 居酒屋",
  chill: "カフェ 落ち着いた",
  travel: "観光スポット",
  birthday: "レストラン 個室",
  anniversary: "レストラン 記念日",
};

/** 雰囲気 → 検索修飾語 マッピング */
const MOOD_MODIFIERS: Record<string, string> = {
  romantic: "おしゃれ",
  fun: "人気",
  relaxed: "落ち着いた",
  luxurious: "高級",
  adventurous: "話題",
};

/**
 * エリア+アクティビティ+雰囲気でGoogle Places Text Searchを実行し、
 * 実在する店舗リストを取得する（AIプロンプト注入用の事前検索）。
 *
 * 写真CDN URLの解決はスキップ（Post-searchで解決するため）。
 */
export async function searchAreaVenues(
  area: string,
  citySearchName: string,
  activities: string[],
  mood: string,
): Promise<VenueFactData[]> {
  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    console.log("[google-places] API key not set, skipping pre-search");
    return [];
  }

  const searchArea =
    area && area !== "指定なし" && area !== "決まってない"
      ? `${area} ${citySearchName}`
      : citySearchName;
  const moodMod = MOOD_MODIFIERS[mood] || "";

  // アクティビティから検索クエリを構築（最大3つ）
  const queries: string[] = [];
  for (const act of activities.slice(0, 3)) {
    const base = ACTIVITY_SEARCH_QUERIES[act];
    if (base) {
      queries.push(`${searchArea} ${moodMod} ${base}`.trim());
    }
  }
  if (queries.length === 0) {
    queries.push(`${searchArea} ${moodMod} デート おすすめ`.trim());
  }

  const seenPlaceIds = new Set<string>();
  const results: VenueFactData[] = [];

  // 並列検索
  const searchPromises = queries.map(
    async (query): Promise<VenueFactData[]> => {
      try {
        const searchRes = await fetch(`${PLACES_API_BASE}/places:searchText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": PRE_SEARCH_FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: "ja",
            maxResultCount: 5,
          }),
        });

        if (!searchRes.ok) {
          console.error(
            `[google-places] Pre-search failed for "${query}": ${searchRes.status}`,
          );
          return [];
        }

        const data = (await searchRes.json()) as PlacesNewSearchResponse;
        const places = data.places || [];

        const filtered = places.filter((p) => {
          const types = p.types ?? [];
          return !types.some((t) => EXCLUDED_TYPES.includes(t));
        });

        const mapsKey = getMapsApiKey();
        return filtered.map((place) => {
          let photoReference: string | null = null;
          let photoAttribution: string | null = null;
          if (place.photos && place.photos.length > 0) {
            photoReference = place.photos[0].name;
            const author = place.photos[0].authorAttributions?.[0];
            if (author) {
              photoAttribution = author.uri
                ? `<a href="${author.uri}" target="_blank" rel="noopener noreferrer">${author.displayName}</a>`
                : author.displayName;
            }
          }

          const mapEmbedUrl = mapsKey
            ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=place_id:${place.id}`
            : null;

          return {
            placeId: place.id,
            name: place.displayName?.text ?? "",
            address: place.formattedAddress ?? searchArea,
            lat: place.location?.latitude ?? 0,
            lng: place.location?.longitude ?? 0,
            rating: place.rating ?? null,
            priceLevel: place.priceLevel
              ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null)
              : null,
            openingHours:
              place.regularOpeningHours?.weekdayDescriptions ?? null,
            isOpenNow: place.regularOpeningHours?.openNow ?? null,
            phoneNumber: null,
            website: null,
            types: place.types ?? [],
            photoReference,
            photoUrl: null,
            photoHtmlAttribution: photoAttribution,
            source: "google_places" as const,
            googleMapsUrl:
              place.googleMapsUri ??
              `https://www.google.com/maps/place/?q=place_id:${place.id}`,
            mapEmbedUrl,
          };
        });
      } catch (error) {
        console.error(
          `[google-places] Pre-search error for "${query}":`,
          error,
        );
        return [];
      }
    },
  );

  const allResults = await Promise.all(searchPromises);
  for (const venues of allResults) {
    for (const venue of venues) {
      if (venue.name && !seenPlaceIds.has(venue.placeId)) {
        seenPlaceIds.add(venue.placeId);
        results.push(venue);
      }
    }
  }

  console.log(
    `[google-places] Pre-search found ${results.length} unique venues for area="${area}"`,
  );
  return results;
}

// ============================================================
// プロンプト用フォーマット
// ============================================================

/**
 * ファクトデータをAIプロンプト用のテキストに変換。
 * AIはこのデータを「絶対改変不可」として扱う。
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
