/**
 * 特集ページデータ管理
 *
 * DB (Neon Postgres) からデータを読み込む。
 * DB接続不可の場合はJSON fallbackを使用。
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
}

/** JSON fallback data */
const jsonArticles: FeaturedArticle[] = featuresData as FeaturedArticle[];

/**
 * 全特集を取得 (DB優先、fallback: JSON)
 */
export async function getAllFeatures(): Promise<FeaturedArticle[]> {
  try {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(featuresTable).orderBy(featuresTable.publishedAt);
      if (rows.length > 0) {
        return rows.map(rowToArticle);
      }
    }
  } catch (e) {
    console.warn("DB read failed, using JSON fallback:", e);
  }
  return jsonArticles;
}

/**
 * slugで特集を取得 (DB優先、fallback: JSON)
 */
export async function getFeatureBySlug(slug: string): Promise<FeaturedArticle | undefined> {
  try {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(featuresTable).where(eq(featuresTable.slug, slug));
      if (rows.length > 0) {
        return rowToArticle(rows[0]);
      }
    }
  } catch (e) {
    console.warn("DB read failed, using JSON fallback:", e);
  }
  return jsonArticles.find((a) => a.slug === slug);
}

/**
 * エリアで関連特集を取得
 */
export async function getFeaturesByArea(area: string, limit = 3): Promise<FeaturedArticle[]> {
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

/** DB row → FeaturedArticle 変換 */
function rowToArticle(row: typeof featuresTable.$inferSelect): FeaturedArticle {
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
    heroImage: row.heroImage || undefined,
    spots: jsonArticles.find(a => a.slug === row.slug)?.spots || (row.spots as FeaturedSpot[]) || [],
    dateGuide: jsonArticles.find(a => a.slug === row.slug)?.dateGuide,
  };
}
