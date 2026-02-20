/**
 * 特集ページデータ管理
 *
 * JSON ファイル (src/data/features.json) からデータを読み込む。
 * 管理画面から CRUD API 経由でデータを更新可能。
 *
 * ビルド時は JSON ファイルを直接 import し、
 * API 経由の操作では fs で読み書きする。
 */

import featuresData from "@/data/features.json";

export type EmbedPlatform = "instagram" | "tiktok";

export interface SpotEmbed {
  platform: EmbedPlatform;
  url: string;
  caption: string;
}

export interface FeaturedSpot {
  name: string;
  area: string;
  genre: string;
  description: string;
  tip: string;
  instagramHashtag?: string;
  tiktokHashtag?: string;
  embeds: SpotEmbed[];
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
}

/**
 * 特集記事データ（JSON から読み込み）
 */
const featuredArticles: FeaturedArticle[] = featuresData as FeaturedArticle[];

/**
 * 全特集を取得
 */
export function getAllFeatures(): FeaturedArticle[] {
  return featuredArticles;
}

/**
 * slugで特集を取得
 */
export function getFeatureBySlug(slug: string): FeaturedArticle | undefined {
  return featuredArticles.find((a) => a.slug === slug);
}

/**
 * エリアで関連特集を取得
 */
export function getFeaturesByArea(area: string, limit = 3): FeaturedArticle[] {
  const normalized = area.toLowerCase();
  return featuredArticles
    .filter(
      (a) =>
        a.area.toLowerCase().includes(normalized) ||
        a.tags.some((t) => t.toLowerCase().includes(normalized)),
    )
    .slice(0, limit);
}
