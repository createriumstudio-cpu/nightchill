/**
 * SEOブログ記事自動生成システム
 *
 * Vercel Cron から定期実行。
 * Google Places API (New) で各都市のスポット情報を取得し、
 * Anthropic Claude でSEO最適化されたブログ記事を生成する。
 * 記事はdraft状態（isPublished: false）でDB保存される。
 */

import { CITIES, type CityData } from "./cities";
import { getDb } from "./db";
import { blogPosts } from "./schema";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================
// 型定義
// ============================================================

export type BlogCategory =
  | "date-plan"       // デートプラン記事
  | "spot-guide"      // スポットガイド
  | "seasonal-event"; // 季節イベント

interface PlacesTextSearchResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    rating?: number;
    types?: string[];
    photos?: Array<{ name: string }>;
    googleMapsUri?: string;
    editorialSummary?: { text: string };
  }>;
}

export interface GeneratedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  tags: string[];
  city: string;
}

// ============================================================
// 定数
// ============================================================

const PLACES_API_BASE = "https://places.googleapis.com/v1";

const CATEGORY_CONFIG: Record<BlogCategory, {
  label: string;
  searchSuffix: string;
}> = {
  "date-plan": {
    label: "デートプラン",
    searchSuffix: "デート おすすめ カップル",
  },
  "spot-guide": {
    label: "スポットガイド",
    searchSuffix: "人気スポット おすすめ",
  },
  "seasonal-event": {
    label: "季節イベント",
    searchSuffix: "季節 イベント デート",
  },
};

// ============================================================
// ヘルパー
// ============================================================

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function getDateBatch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// ============================================================
// Google Places API: スポット検索
// ============================================================

export async function searchSpotsForBlog(
  city: CityData,
  category: BlogCategory,
): Promise<PlacesTextSearchResponse["places"]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[blog-gen] GOOGLE_PLACES_API_KEY not set");
    return [];
  }

  const config = CATEGORY_CONFIG[category];
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
          textQuery: `${city.searchName} ${area} ${config.searchSuffix}`,
          languageCode: "ja",
          maxResultCount: 5,
        }),
      });

      if (!res.ok) {
        console.error(`[blog-gen] Places API error for ${area}: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as PlacesTextSearchResponse;
      if (data.places) {
        allPlaces.push(...data.places);
      }
    } catch (error) {
      console.error(`[blog-gen] Places search failed for ${area}:`, error);
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
    .slice(0, 8);
}

// ============================================================
// Anthropic Claude: ブログ記事生成
// ============================================================

export async function generateBlogPostWithAI(
  city: CityData,
  category: BlogCategory,
  spots: NonNullable<PlacesTextSearchResponse["places"]>,
): Promise<GeneratedBlogPost | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[blog-gen] ANTHROPIC_API_KEY not set, using template");
    return generateTemplateBlogPost(city, category, spots);
  }

  const config = CATEGORY_CONFIG[category];
  const season = getCurrentSeason();
  const dateBatch = getDateBatch();

  const spotsInfo = spots
    .map(
      (s, i) =>
        `${i + 1}. ${s.displayName?.text ?? "不明"} (住所: ${s.formattedAddress ?? "不明"}, 評価: ${s.rating ?? "不明"}, タイプ: ${(s.types ?? []).slice(0, 3).join(", ")}${s.editorialSummary?.text ? `, 概要: ${s.editorialSummary.text}` : ""})`,
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
          content: `あなたはデートメディア「futatabito」の専門ライターです。SEOに強いブログ記事のJSONを生成してください。

【条件】
- 都市: ${city.name}
- カテゴリ: ${config.label}
- 季節: ${season}
- ターゲット: デートを計画しているカップル

【Google Places APIから取得した実際のスポット情報】
${spotsInfo}

【出力形式】以下のJSON形式で出力してください。店舗名・住所は改変しないでください。
{
  "title": "SEOキーワードを含む記事タイトル（30-50文字）",
  "excerpt": "記事の要約（100-150文字、検索結果に表示される）",
  "content": "Markdown形式の記事本文（1500-2000文字）。## 見出しで区切り、各スポットの紹介を含める。「futatabito」のサービス名に言及しない。外部リンクを含めない。",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4"]
}

【注意事項】
- タイトルは「${city.name} デート」「${season}」などSEOキーワードを自然に含める
- contentはMarkdown形式（## 見出し、**太字**、箇条書きを適切に使用）
- 各スポットは実在するデータに基づき正確に記述する
- カップル目線で実用的なデート情報を提供する
- SNS埋め込みや外部リンクは絶対に含めない
- JSONのみを出力し、他のテキストは含めないでください。`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[blog-gen] Failed to parse AI response");
      return generateTemplateBlogPost(city, category, spots);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      title: string;
      excerpt: string;
      content: string;
      tags: string[];
    };

    const slug = `${city.id}-${category}-${dateBatch}`;

    return {
      slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      category,
      tags: parsed.tags,
      city: city.id,
    };
  } catch (error) {
    console.error("[blog-gen] AI generation failed:", error);
    return generateTemplateBlogPost(city, category, spots);
  }
}

// ============================================================
// テンプレートフォールバック
// ============================================================

export function generateTemplateBlogPost(
  city: CityData,
  category: BlogCategory,
  spots: NonNullable<PlacesTextSearchResponse["places"]>,
): GeneratedBlogPost {
  const config = CATEGORY_CONFIG[category];
  const season = getCurrentSeason();
  const dateBatch = getDateBatch();
  const slug = `${city.id}-${category}-${dateBatch}`;

  const spotSections = spots.slice(0, 5).map((s) => {
    const name = s.displayName?.text ?? "スポット";
    const address = s.formattedAddress ?? "";
    const rating = s.rating ? `★${s.rating}` : "";
    return `## ${name}\n\n${address}${rating ? ` ${rating}` : ""}\n\n${s.editorialSummary?.text ?? `${city.name}で人気の${name}。デートにおすすめのスポットです。`}`;
  }).join("\n\n");

  const content = `# ${season}の${city.name}${config.label}\n\n${season}の${city.name}でデートを計画中のカップルにおすすめのスポットをご紹介します。\n\n${spotSections}`;

  return {
    slug,
    title: `【${season}】${city.name}の${config.label}おすすめスポット`,
    excerpt: `${season}の${city.name}でデートを計画中のカップルへ。${config.label}に最適なスポットを厳選してご紹介します。`,
    content,
    category,
    tags: [city.name, season, "デート", config.label],
    city: city.id,
  };
}

// ============================================================
// DB保存（draft状態）
// ============================================================

export async function saveBlogPostAsDraft(
  post: GeneratedBlogPost,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const db = getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const now = new Date();
    await db.insert(blogPosts).values({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      city: post.city,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: blogPosts.slug,
      set: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        updatedAt: now,
      },
    });

    console.log(`[blog-gen] Saved draft: ${post.slug}`);
    return { success: true, slug: post.slug };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[blog-gen] DB save failed:`, error);
    return { success: false, error: msg };
  }
}

// ============================================================
// メイン: ブログ記事生成
// ============================================================

export async function generateBlogPost(
  city: CityData,
  category: BlogCategory,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  console.log(`[blog-gen] Generating: ${city.name} / ${category}`);

  try {
    // 1. Google Places API でスポット検索
    const spots = await searchSpotsForBlog(city, category);
    if (!spots || spots.length === 0) {
      return { success: false, error: `No spots found for ${city.name}` };
    }

    // 2. 記事生成（AI or テンプレート）
    const post = await generateBlogPostWithAI(city, category, spots);
    if (!post) {
      return { success: false, error: "Article generation failed" };
    }

    // 3. draft状態でDB保存
    return await saveBlogPostAsDraft(post);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[blog-gen] Error:`, error);
    return { success: false, error: msg };
  }
}

/**
 * バッチ実行: ランダムに2-3都市を選択し、各カテゴリから1つ生成。
 */
export async function runBlogBatch(): Promise<{
  results: Array<{
    city: string;
    category: string;
    success: boolean;
    slug?: string;
    error?: string;
  }>;
}> {
  console.log("[blog-gen] Starting batch...");

  // ランダムに2-3都市を選択
  const shuffled = [...CITIES].sort(() => Math.random() - 0.5);
  const selectedCities = shuffled.slice(0, 3);

  // カテゴリもランダムに1-2個選択
  const categories: BlogCategory[] = ["date-plan", "spot-guide", "seasonal-event"];
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
      const result = await generateBlogPost(city, category);
      results.push({
        city: city.name,
        category,
        ...result,
      });

      // API レート制限対策: 各生成間に2秒待機
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(
    `[blog-gen] Batch complete: ${results.filter((r) => r.success).length}/${results.length} succeeded`,
  );

  return { results };
}
