/**
 * 特集ページデータ管理
 *
 * DB (Neon Postgres) からデータを読み込む。
 * DB接続不可の場合はJSON fallbackを使用。
 *
 * 静的記事 (JSON) と週次自動生成記事 (DB) をマージして返す。
 */

import featuresData from "@/data/features.json";
import { getDb } from "./db";
import { features as featuresTable } from "./schema";
import { eq, desc, sql } from "drizzle-orm";

export interface FeaturedSpot {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
}

export interface DateGuide {
  areaType: "evening" | "daytime" | "allday";
  areaTypeLabel: string;
  recommendedDuration: string;
  recommendedMeetTime: string;
  recommendedDismissTime: string;
  bestFor: string;
  tip: string;
}

export interface FeaturedArticle {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  area: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  heroEmoji: string;
  heroImage?: string;
  spots: FeaturedSpot[];
  dateGuide?: DateGuide;
  /** 週次自動生成記事かどうか */
  isWeekly?: boolean;
}

/** JSON fallback data (静的な定番特集) */
const jsonArticles: FeaturedArticle[] = (featuresData as FeaturedArticle[]).map(
  (a) => ({ ...a, isWeekly: false }),
);

/** 静的記事のslugセット */
const staticSlugs = new Set(jsonArticles.map((a) => a.slug));

// ============================================================
// DB row → FeaturedArticle 変換
// ============================================================

function rowToArticle(row: typeof featuresTable.$inferSelect): FeaturedArticle {
  const isStatic = staticSlugs.has(row.slug);
  const jsonMatch = isStatic
    ? jsonArticles.find((a) => a.slug === row.slug)
    : undefined;

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    area: row.area,
    tags: (row.tags as string[]) || [],
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    heroEmoji: row.heroEmoji,
    heroImage: row.heroImage || jsonMatch?.heroImage || undefined,
    spots: jsonMatch?.spots || (row.spots as FeaturedSpot[]) || [],
    dateGuide: jsonMatch?.dateGuide,
    isWeekly: !isStatic,
  };
}

// ============================================================
// 公開API
// ============================================================

/**
 * 全特集を取得（静的JSON + DB週次記事をマージ）
 * 静的記事が常に含まれ、DB週次記事が追加される。
 */
export async function getAllFeatures(): Promise<FeaturedArticle[]> {
  // 常にJSON静的記事を含める
  const result = [...jsonArticles];

  try {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.isPublished, true))
        .orderBy(desc(featuresTable.publishedAt));

      for (const row of rows) {
        // 静的記事と同じslugならスキップ（JSONが正）
        if (staticSlugs.has(row.slug)) continue;
        result.push(rowToArticle(row));
      }
    }
  } catch (e) {
    console.warn("DB read failed, using JSON only:", e);
  }

  return result;
}

/**
 * 週次自動生成記事のみを取得（新しい順）
 */
export async function getWeeklyFeatures(
  cityName?: string,
  limit = 10,
): Promise<FeaturedArticle[]> {
  try {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(featuresTable)
      .where(eq(featuresTable.isPublished, true))
      .orderBy(desc(featuresTable.publishedAt))
      .limit(limit);

    // 静的slugを除外 + 都市フィルタ
    return rows
      .filter((row) => !staticSlugs.has(row.slug))
      .filter((row) => !cityName || row.area === cityName)
      .map(rowToArticle);
  } catch (e) {
    console.warn("DB read failed for weekly features:", e);
    return [];
  }
}

/**
 * 最新の週次記事を取得（トップページ等での表示用）
 */
export async function getLatestWeeklyFeatures(
  limit = 6,
): Promise<FeaturedArticle[]> {
  return getWeeklyFeatures(undefined, limit);
}

/**
 * slugで特集を取得 (DB優先、fallback: JSON)
 */
export async function getFeatureBySlug(
  slug: string,
): Promise<FeaturedArticle | undefined> {
  // まずDBから
  try {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.slug, slug));
      if (rows.length > 0) {
        return rowToArticle(rows[0]);
      }
    }
  } catch (e) {
    console.warn("DB read failed, using JSON fallback:", e);
  }
  // JSON fallback
  return jsonArticles.find((a) => a.slug === slug);
}

/**
 * エリアで関連特集を取得
 */
export async function getFeaturesByArea(
  area: string,
  limit = 3,
): Promise<FeaturedArticle[]> {
  const all = await getAllFeatures();
  const normalized = area.toLowerCase();
  return all
    .filter(
      (a) =>
        a.area.toLowerCase().includes(normalized) ||
        a.tags.some((t) => t.toLowerCase().includes(normalized)),
    )
    .slice(0, limit);
}
