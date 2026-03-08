/**
 * 予約アフィリエイトリンク生成ユーティリティ
 *
 * 提携店舗のアフィリエイトURLにUTMパラメータを付与し、
 * トラッキング可能なリンクを生成する。
 *
 * 対応プロバイダー: ホットペッパー, 一休, 食べログ, etc.
 */

import { getDb } from "./db";
import { partnerVenues } from "./schema";
import { eq, and } from "drizzle-orm";
import type { Activity, Mood } from "./types";
import { getCityById, getCityByName } from "./cities";

export type AffiliateProvider =
  | "hotpepper"
  | "ikyu"
  | "tabelog"
  | "otonamie"
  | "other";

export interface AffiliateVenue {
  id: number;
  name: string;
  description: string | null;
  category: string;
  area: string;
  city: string;
  imageUrl: string | null;
  priceRange: string | null;
  affiliateUrl: string;
  affiliateProvider: string;
  relevanceReason: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  hotpepper: "ホットペッパーで予約",
  ikyu: "一休.comで予約",
  tabelog: "食べログで予約",
  otonamie: "OZmallで予約",
  other: "予約サイトへ",
};

/**
 * アフィリエイトURLにUTMパラメータを付与
 */
export function buildAffiliateLink(
  baseUrl: string,
  source: string = "futatabito",
  medium: string = "referral",
  campaign: string = "date-plan",
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch {
    // URLが不正な場合はそのまま返す
    return baseUrl;
  }
}

/**
 * プロバイダーに応じたCTAラベルを返す
 */
export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || PROVIDER_LABELS.other;
}

/**
 * デートプランの文脈に合致する提携店舗を検索
 *
 * マッチング: city + occasion/mood のコンテキストマッチング
 */
export async function findAffiliateVenues(
  city: string,
  occasion: Activity,
  mood: Mood,
  limit: number = 2,
): Promise<AffiliateVenue[]> {
  const db = getDb();
  if (!db) return [];

  const allVenues = await db
    .select()
    .from(partnerVenues)
    .where(and(eq(partnerVenues.isActive, true)));

  if (allVenues.length === 0) return [];

  // city ID と city name の両方でマッチングできるようにする
  // 例: city="tokyo" → "東京" もマッチ、city="東京" → "tokyo" もマッチ
  const cityData = getCityById(city) || getCityByName(city);
  const cityMatches = new Set<string>();
  cityMatches.add(city);
  if (cityData) {
    cityMatches.add(cityData.id);
    cityMatches.add(cityData.name);
  }

  // city + アフィリエイトURL必須フィルタ
  const candidates = allVenues.filter(
    (v) => cityMatches.has(v.city) && v.affiliateUrl,
  );

  if (candidates.length === 0) return [];

  // スコアリング
  const scored = candidates.map((venue) => {
    let score = 0;
    let reason = "";

    const targetOccasions = (venue.targetOccasions as string[]) || [];
    const targetMoods = (venue.targetMoods as string[]) || [];

    const occasionMatch =
      targetOccasions.length === 0 || targetOccasions.includes(occasion);
    const moodMatch =
      targetMoods.length === 0 || targetMoods.includes(mood);

    if (occasionMatch && moodMatch) {
      score = 2;
      reason = "このデートにぴったりのお店";
    } else if (occasionMatch) {
      score = 1;
      reason = "このシーンにおすすめ";
    } else if (moodMatch) {
      score = 1;
      reason = "今の雰囲気にぴったり";
    } else {
      // cityマッチのみ
      score = 0.5;
      reason = `${venue.city}のおすすめ店`;
    }

    return { venue, score, reason };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      id: s.venue.id,
      name: s.venue.name,
      description: s.venue.description,
      category: s.venue.category,
      area: s.venue.area,
      city: s.venue.city,
      imageUrl: s.venue.imageUrl,
      priceRange: s.venue.priceRange,
      affiliateUrl: buildAffiliateLink(s.venue.affiliateUrl!),
      affiliateProvider: s.venue.affiliateProvider || "other",
      relevanceReason: s.reason,
    }));
}
