/**
 * Gemini Google Search Grounding サービス
 *
 * Google Places API (BILLING_DISABLED で 403) の代替として、
 * Gemini の Google Search grounding を使って店舗のファクトデータを取得する。
 *
 * Gemini 2.0+ の google_search ツールを使用（REST API 直接呼び出し）。
 */

import type { VenueFactData } from "./google-places";
import { env } from "./env";

// ============================================================
// Gemini REST API 型定義
// ============================================================

interface GeminiContent {
  role: string;
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    groundingMetadata?: {
      searchEntryPoint?: { renderedContent?: string };
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
      }>;
      webSearchQueries?: string[];
    };
  }>;
}

// ============================================================
// 定数
// ============================================================

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// ============================================================
// 内部: Gemini REST API 呼び出し（Google Search grounding 付き）
// ============================================================

async function callGeminiWithSearch(
  prompt: string,
  systemInstruction?: string,
): Promise<{ text: string; groundingChunks: Array<{ uri?: string; title?: string }> }> {
  const apiKey = env().GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = env().GEMINI_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      } satisfies GeminiContent,
    ],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    body.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API failed ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];

  // With Google Search grounding enabled, Gemini returns multiple parts:
  // functionCall/functionResponse parts (no text) and multiple text parts.
  // Earlier text parts may contain partial/duplicate JSON.
  // Use only the LAST text part (the final synthesized answer).
  const textParts = (candidate?.content?.parts ?? [])
    .map((p) => p.text)
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const text = textParts.length > 0 ? textParts[textParts.length - 1] : "";

  const groundingChunks = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((c) => c.web ?? {})
    .filter((w) => w.uri || w.title);

  return { text, groundingChunks };
}

// ============================================================
// 公開: 単一店舗検索（Post-search 代替）
// ============================================================

/**
 * 店舗名 + エリアで Gemini Google Search grounding を使い、
 * 店舗のファクトデータを取得する。
 * Google Places API の searchVenue() の代替。
 */
export async function searchVenueWithGemini(
  query: string,
  area: string,
  _genreHint?: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<VenueFactData | null> {
  const apiKey = env().GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[gemini-search] GEMINI_API_KEY not set, using fallback");
    return createFallbackVenue(query, area);
  }

  try {
    const prompt = `「${query}」（${area}付近）について、以下の情報をJSON形式で返してください。
Google検索で実在を確認し、正確な情報のみ記載してください。見つからない場合は null を返してください。

{
  "name": "正式な店舗名",
  "address": "住所",
  "rating": 評価（数値 or null）,
  "website": "公式サイトURL or null",
  "phoneNumber": "電話番号 or null",
  "genre": "ジャンル（カフェ、レストラン、バー、観光スポット等）"
}

JSONのみ出力。他のテキストは不要。`;

    const { text, groundingChunks } = await callGeminiWithSearch(prompt);

    // "null" レスポンスの場合
    if (text.trim() === "null" || text.trim() === "") {
      console.warn(`[gemini-search] No results for: ${query}`);
      return createFallbackVenue(query, area);
    }

    // JSON 抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`[gemini-search] Could not parse response for: ${query}`);
      return createFallbackVenue(query, area);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      name?: string;
      address?: string;
      rating?: number | null;
      website?: string | null;
      phoneNumber?: string | null;
      genre?: string;
    };

    // Google Maps URL を構築（名前 + 住所ベース）
    const venueName = parsed.name || query;
    const venueAddress = parsed.address || area;
    const mapsQuery = encodeURIComponent(`${venueName} ${venueAddress}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    // Maps Embed URL
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapEmbedUrl = mapsKey
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${mapsQuery}`
      : null;

    // Grounding chunk から公式サイトを補完
    let website = parsed.website || null;
    if (!website && groundingChunks.length > 0) {
      const officialSite = groundingChunks.find(
        (c) => c.uri && !c.uri.includes("google.com") && !c.uri.includes("tabelog") && !c.uri.includes("hotpepper"),
      );
      if (officialSite?.uri) {
        website = officialSite.uri;
      }
    }

    console.log(`[gemini-search] Found: "${venueName}" at "${venueAddress}"`);

    return {
      placeId: "",
      name: venueName,
      address: venueAddress,
      lat: 0,
      lng: 0,
      rating: parsed.rating ?? null,
      priceLevel: null,
      openingHours: null,
      isOpenNow: null,
      phoneNumber: parsed.phoneNumber || null,
      website,
      types: parsed.genre ? [parsed.genre] : [],
      photoReference: null,
      photoUrl: null,
      photoHtmlAttribution: null,
      source: "google_places" as const,
      googleMapsUrl,
      mapEmbedUrl,
    };
  } catch (error) {
    console.error(`[gemini-search] Error searching "${query}":`, error);
    return createFallbackVenue(query, area);
  }
}

// ============================================================
// 公開: バッチ店舗検索（複数店舗を1回のAPI呼び出しで検索）
// ============================================================

/**
 * 複数の店舗名を1回の Gemini 呼び出しでまとめて検索する。
 * Post-search の効率化版。個別に searchVenueWithGemini を呼ぶより
 * API 呼び出し回数とコストを大幅に削減できる。
 */
export async function batchSearchVenuesWithGemini(
  venues: Array<{ name: string; activity?: string }>,
  area: string,
): Promise<Map<string, VenueFactData>> {
  const apiKey = env().GEMINI_API_KEY;
  const resultMap = new Map<string, VenueFactData>();

  if (!apiKey || venues.length === 0) {
    return resultMap;
  }

  const venueList = venues
    .map((v, i) => `${i + 1}. ${v.name}`)
    .join("\n");

  try {
    const prompt = `以下の店舗・スポット（${area}付近）について、それぞれの情報をJSON配列で返してください。
Google検索で実在を確認し、正確な情報のみ記載してください。

${venueList}

以下のJSON配列形式で出力してください：
[
  {
    "name": "正式な店舗名",
    "address": "住所",
    "rating": 評価（数値 or null）,
    "website": "公式サイトURL or null",
    "phoneNumber": "電話番号 or null",
    "genre": "ジャンル"
  }
]

JSONのみ出力。他のテキストは不要。`;

    const { text } = await callGeminiWithSearch(prompt);

    // JSON 配列を抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[gemini-search] Could not parse batch response");
      return resultMap;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      name?: string;
      address?: string;
      rating?: number | null;
      website?: string | null;
      phoneNumber?: string | null;
      genre?: string;
    }>;

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

    for (let i = 0; i < Math.min(parsed.length, venues.length); i++) {
      const item = parsed[i];
      const originalName = venues[i].name;
      const venueName = item.name || originalName;
      const venueAddress = item.address || area;
      const mapsQuery = encodeURIComponent(`${venueName} ${venueAddress}`);

      resultMap.set(originalName, {
        placeId: "",
        name: venueName,
        address: venueAddress,
        lat: 0,
        lng: 0,
        rating: item.rating ?? null,
        priceLevel: null,
        openingHours: null,
        isOpenNow: null,
        phoneNumber: item.phoneNumber || null,
        website: item.website || null,
        types: item.genre ? [item.genre] : [],
        photoReference: null,
        photoUrl: null,
        photoHtmlAttribution: null,
        source: "google_places" as const,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        mapEmbedUrl: mapsKey
          ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${mapsQuery}`
          : null,
      });
    }

    console.log(`[gemini-search] Batch search found ${resultMap.size}/${venues.length} venues`);
  } catch (error) {
    console.error("[gemini-search] Batch search error:", error);
  }

  return resultMap;
}

// ============================================================
// 公開: 週次特集用スポット検索
// ============================================================

export interface TrendingSpotInfo {
  name: string;
  address: string;
  rating: number | null;
  genre: string;
  description: string;
  googleMapsUri: string;
}

/**
 * Gemini Google Search grounding を使って、都市のトレンドスポットを検索する。
 * weekly-feature-generator.ts の searchTrendingSpots() の代替。
 */
export async function searchTrendingSpotsWithGemini(
  cityName: string,
  areas: string[],
  searchSuffix: string,
): Promise<TrendingSpotInfo[]> {
  const apiKey = env().GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[gemini-search] GEMINI_API_KEY not set for trending spots search");
    return [];
  }

  const selectedAreas = areas.sort(() => Math.random() - 0.5).slice(0, 3);
  const areasText = selectedAreas.join("、");

  try {
    const prompt = `${cityName}（${areasText}エリア）の${searchSuffix}に関するおすすめスポットを6件、JSON配列で返してください。
Google検索で実在を確認し、正確な情報のみ記載してください。

[
  {
    "name": "店舗・スポット名",
    "address": "住所",
    "rating": 評価（数値 or null）,
    "genre": "ジャンル（restaurant/cafe/bar/spot）",
    "description": "100文字程度の紹介文"
  }
]

JSONのみ出力。他のテキストは不要。`;

    const { text } = await callGeminiWithSearch(prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[gemini-search] Could not parse trending spots response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      name?: string;
      address?: string;
      rating?: number | null;
      genre?: string;
      description?: string;
    }>;

    return parsed
      .filter((s) => s.name)
      .map((s) => {
        const mapsQuery = encodeURIComponent(`${s.name} ${s.address || cityName}`);
        return {
          name: s.name!,
          address: s.address || cityName,
          rating: s.rating ?? null,
          genre: s.genre || "spot",
          description: s.description || "",
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        };
      });
  } catch (error) {
    console.error("[gemini-search] Trending spots search error:", error);
    return [];
  }
}

// ============================================================
// フォールバック
// ============================================================

function createFallbackVenue(name: string, area: string): VenueFactData {
  return {
    placeId: "",
    name,
    address: `${area}（詳細はGoogle検索でご確認ください）`,
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
