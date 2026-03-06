/**
 * 週次特集記事自動生成システム
 *
 * 毎週月曜に Vercel Cron から実行される。
 * Google Places API (New) で各都市の注目スポットを取得し、
 * Anthropic Claude でデートプラン特集記事を生成する。
 *
 * B案: リアルタイム週次更新 — 「今週のおすすめデートプラン」
 */

import { CITIES, type CityData } from "./cities";
import { getDb } from "./db";
import { features as featuresTable } from "./schema";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// 型定義
// ============================================================

export interface WeeklyFeatureInput {
  city: CityData;
  category: WeeklyCategory;
  weekBatch: string; // YYYY-Wnn 形式
}

export type WeeklyCategory =
  | "new-spots"       // 注目の新店・話題のスポット
  | "seasonal-menu"   // 季節限定メニュー・期間限定イベント
  | "classic-date";   // この季節の外さないデートプラン

interface PlacesTextSearchResponse {
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
    types?: string[];
    photos?: Array<{ name: string }>;
    googleMapsUri?: string;
    editorialSummary?: { text: string };
  }>;
}

interface GeneratedArticle {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  area: string;
  tags: string[];
  heroEmoji: string;
  spots: Array<{
    name: string;
    area: string;
    genre: string;
    description: string;
    tip: string;
    photoUrl?: string;
  }>;
}

// ============================================================
// 定数
// ============================================================

const PLACES_API_BASE = "https://places.googleapis.com/v1";

const CATEGORY_CONFIG: Record<WeeklyCategory, {
  label: string;
  searchSuffix: string;
  emoji: string;
}> = {
  "new-spots": {
    label: "注目の新店・話題のスポット",
    searchSuffix: "新しい おしゃれ デート",
    emoji: "✨",
  },
  "seasonal-menu": {
    label: "季節限定メニュー・期間限定",
    searchSuffix: "季節限定 期間限定 デート",
    emoji: "🌸",
  },
  "classic-date": {
    label: "外さないデートプラン",
    searchSuffix: "人気 デート おすすめ",
    emoji: "💑",
  },
};

/**
 * Places photos[0].name から写真URLを構築する。
 * Places API (New) の Photo Media エンドポイント形式。
 */
function buildPhotoUrl(photoName: string, apiKey: string): string {
  return `${PLACES_API_BASE}/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`;
}

/**
 * Places API結果からスポット名→photoUrl のマップを構築する。
 */
function buildPhotoUrlMap(
  spots: NonNullable<PlacesTextSearchResponse["places"]>,
): Map<string, string> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const map = new Map<string, string>();
  if (!apiKey) return map;

  for (const spot of spots) {
    const name = spot.displayName?.text;
    if (name && spot.photos && spot.photos.length > 0) {
      map.set(name, buildPhotoUrl(spot.photos[0].name, apiKey));
    }
  }
  return map;
}

/** 季節判定 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

/** 週番号を取得 (ISO 8601) */
function getWeekBatch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - oneJan.getTime()) / 86400000);
  const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

// ============================================================
// Google Places API: スポット検索
// ============================================================

async function searchTrendingSpots(
  city: CityData,
  category: WeeklyCategory,
): Promise<PlacesTextSearchResponse["places"]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[weekly-gen] GOOGLE_PLACES_API_KEY not set");
    return [];
  }

  const config = CATEGORY_CONFIG[category];
  // ランダムにエリアを2-3つ選択して検索の多様性を確保
  const shuffled = [...city.areas].sort(() => Math.random() - 0.5);
  const selectedAreas = shuffled.slice(0, 3);

  const allPlaces: NonNullable<PlacesTextSearchResponse["places"]> = [];

  for (const area of selectedAreas) {
    try {
      const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.types",
            "places.photos",
            "places.googleMapsUri",
            "places.editorialSummary",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: `${area} ${config.searchSuffix}`,
          languageCode: "ja",
          maxResultCount: 5,
        }),
      });

      if (!res.ok) {
        console.error(`[weekly-gen] Places API error for ${area}: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as PlacesTextSearchResponse;
      if (data.places) {
        allPlaces.push(...data.places);
      }
    } catch (error) {
      console.error(`[weekly-gen] Places search failed for ${area}:`, error);
    }
  }

  // 重複除去 & レーティング順ソート
  const unique = new Map<string, (typeof allPlaces)[0]>();
  for (const place of allPlaces) {
    if (place.id && !unique.has(place.id)) {
      unique.set(place.id, place);
    }
  }

  return [...unique.values()]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);
}

// ============================================================
// Anthropic Claude: 記事生成
// ============================================================

async function generateArticleWithAI(
  city: CityData,
  category: WeeklyCategory,
  spots: NonNullable<PlacesTextSearchResponse["places"]>,
  weekBatch: string,
): Promise<GeneratedArticle | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[weekly-gen] ANTHROPIC_API_KEY not set, using template");
    return generateTemplateArticle(city, category, spots, weekBatch);
  }

  const config = CATEGORY_CONFIG[category];
  const season = getCurrentSeason();

  const spotsInfo = spots
    .map(
      (s, i) =>
        `${i + 1}. ${s.displayName?.text ?? "不明"} (住所: ${s.formattedAddress ?? "不明"}, 評価: ${s.rating ?? "不明"}, タイプ: ${(s.types ?? []).slice(0, 3).join(", ")})`,
    )
    .join("\n");

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `あなたはデートプランの専門ライターです。以下の条件で特集記事のJSON構造を生成してください。

【条件】
- 都市: ${city.name}
- カテゴリ: ${config.label}
- 季節: ${season}
- 週: ${weekBatch}

【Google Places APIから取得した実際のスポット情報】
${spotsInfo}

【出力形式】以下のJSON形式で出力してください。説明文は事実に基づき、店舗名・住所は改変しないでください。ご飯スポットは2時間滞在を想定してtipに記載してください。
{
  "title": "記事タイトル（共感型、NO.1などの表現は避ける）",
  "subtitle": "サブタイトル",
  "description": "200文字程度の記事概要",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "heroEmoji": "絵文字1つ",
  "spots": [
    {
      "name": "店舗名（Google Placesのデータそのまま）",
      "area": "エリア名",
      "genre": "ジャンル（cafe/restaurant/bar/spot）",
      "description": "100文字程度の紹介文",
      "tip": "デートでの活用ポイント"
    }
  ]
}

JSONのみを出力し、他のテキストは含めないでください。`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[weekly-gen] Failed to parse AI response");
      return generateTemplateArticle(city, category, spots, weekBatch);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<GeneratedArticle, "slug" | "area">;
    const slug = `${city.id}-${category}-${weekBatch.toLowerCase()}`;

    // Places APIの写真URLをスポットに付与
    const photoMap = buildPhotoUrlMap(spots);
    const enrichedSpots = parsed.spots.map((s) => ({
      ...s,
      photoUrl: photoMap.get(s.name) ?? undefined,
    }));

    return {
      ...parsed,
      slug,
      area: city.name,
      spots: enrichedSpots,
    };
  } catch (error) {
    console.error("[weekly-gen] AI generation failed:", error);
    return generateTemplateArticle(city, category, spots, weekBatch);
  }
}

// ============================================================
// テンプレートフォールバック
// ============================================================

function generateTemplateArticle(
  city: CityData,
  category: WeeklyCategory,
  spots: NonNullable<PlacesTextSearchResponse["places"]>,
  weekBatch: string,
): GeneratedArticle {
  const config = CATEGORY_CONFIG[category];
  const season = getCurrentSeason();
  const slug = `${city.id}-${category}-${weekBatch.toLowerCase()}`;

  const photoMap = buildPhotoUrlMap(spots);

  return {
    slug,
    title: `${season}の${city.name}デート ${config.label}`,
    subtitle: `${weekBatch} ${city.name}エリアの最新おすすめ`,
    description: `${city.name}の${season}にぴったりなデートスポットを厳選。${config.label}をお届けします。`,
    area: city.name,
    tags: [city.name, season, "デート", category],
    heroEmoji: config.emoji,
    spots: spots.slice(0, 4).map((s) => {
      const spotName = s.displayName?.text ?? "スポット";
      return {
        name: spotName,
        area: s.formattedAddress?.split(" ")[0] ?? city.name,
        genre: guessGenre(s.types ?? []),
        description: `${city.name}で人気の${spotName}。評価${s.rating ?? "-"}`,
        tip: "予約がおすすめ。ゆっくり2時間ほど楽しめます。",
        photoUrl: photoMap.get(spotName) ?? undefined,
      };
    }),
  };
}

function guessGenre(types: string[]): string {
  if (types.some((t) => t.includes("restaurant") || t.includes("food")))
    return "restaurant";
  if (types.some((t) => t.includes("cafe") || t.includes("coffee")))
    return "cafe";
  if (types.some((t) => t.includes("bar"))) return "bar";
  return "spot";
}

// ============================================================
// メイン: 週次特集生成
// ============================================================

/**
 * 指定都市・カテゴリの週次特集を生成してDBに保存する。
 */
export async function generateWeeklyFeature(
  input: WeeklyFeatureInput,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const { city, category, weekBatch } = input;
  const config = CATEGORY_CONFIG[category];

  console.log(
    `[weekly-gen] Generating: ${city.name} / ${config.label} / ${weekBatch}`,
  );

  try {
    // 1. Google Places API でスポット検索
    const spots = await searchTrendingSpots(city, category);
    if (!spots || spots.length === 0) {
      return { success: false, error: `No spots found for ${city.name}` };
    }

    // 2. 記事生成（AI or テンプレート）
    const article = await generateArticleWithAI(city, category, spots, weekBatch);
    if (!article) {
      return { success: false, error: "Article generation failed" };
    }

    // 3. DBに保存
    const db = getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const now = new Date();
    await db.insert(featuresTable).values({
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle,
      description: article.description,
      area: article.area,
      tags: article.tags,
      publishedAt: now,
      updatedAt: now,
      heroEmoji: article.heroEmoji,
      heroImage: article.spots?.[0]?.photoUrl || null,
      spots: article.spots,
      isPublished: true,
    }).onConflictDoUpdate({
      target: featuresTable.slug,
      set: {
        title: article.title,
        subtitle: article.subtitle,
        description: article.description,
        tags: article.tags,
        updatedAt: now,
        spots: article.spots,
      },
    });

    console.log(`[weekly-gen] Saved: ${article.slug}`);
    return { success: true, slug: article.slug };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[weekly-gen] Error:`, error);
    return { success: false, error: msg };
  }
}

/**
 * 週次バッチ実行: ランダムに2-3都市を選択し、各カテゴリから1つ生成。
 */
export async function runWeeklyBatch(): Promise<{
  results: Array<{ city: string; category: string; success: boolean; slug?: string; error?: string }>;
}> {
  const weekBatch = getWeekBatch();
  console.log(`[weekly-gen] Starting batch: ${weekBatch}`);

  // ランダムに2-3都市を選択
  const shuffled = [...CITIES].sort(() => Math.random() - 0.5);
  const selectedCities = shuffled.slice(0, 3);

  // カテゴリもランダムに1-2個選択
  const categories: WeeklyCategory[] = ["new-spots", "seasonal-menu", "classic-date"];
  const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
  const selectedCategories = shuffledCats.slice(0, 2);

  const results: Array<{
    city: string;
    category: string;
    success: boolean;
    slug?: string;
    error?: string;
  }> = [];

  for (const city of selectedCities) {
    for (const category of selectedCategories) {
      const result = await generateWeeklyFeature({
        city,
        category,
        weekBatch,
      });
      results.push({
        city: city.name,
        category,
        ...result,
      });

      // API レート制限対策: 各生成間に少し待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(
    `[weekly-gen] Batch complete: ${results.filter((r) => r.success).length}/${results.length} succeeded`,
  );

  return { results };
}
