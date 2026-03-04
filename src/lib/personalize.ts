/**
 * Phase 5: Personalization engine
 *
 * ユーザーの履歴・嗜好に基づいて、おすすめ都市・エリア・特集を返す。
 */

import { getUserPreferences } from "./date-history";
import { getAllFeatures, type FeaturedArticle } from "./features";

export interface PersonalizedRecommendations {
  /** おすすめ都市ID */
  recommendedCities: string[];
  /** おすすめエリア */
  recommendedAreas: string[];
  /** おすすめ特集記事 */
  recommendedFeatures: FeaturedArticle[];
  /** パーソナライズメッセージ */
  message: string;
  /** 嗜好データ概要 */
  preferences: Record<string, unknown> | null;
}

/**
 * ユーザーの嗜好に基づくパーソナライズ推薦を生成
 */
export async function getPersonalizedRecommendations(
  anonId: string,
): Promise<PersonalizedRecommendations> {
  const prefs = await getUserPreferences(anonId);

  if (!prefs || (prefs.totalDates as number) === 0) {
    // 履歴なし → デフォルト推薦
    const features = await getAllFeatures();
    return {
      recommendedCities: ["tokyo", "osaka", "kyoto"],
      recommendedAreas: [],
      recommendedFeatures: features.slice(0, 3),
      message: "まだデート履歴がありません。まずはプランを作ってみましょう！",
      preferences: null,
    };
  }

  const favCities = (prefs.favoriteCities as string[]) || [];
  const favAreas = (prefs.favoriteAreas as string[]) || [];
  const favOccasions = (prefs.favoriteOccasions as string[]) || [];
  const totalDates = (prefs.totalDates as number) || 0;

  // 特集記事をスコアリング
  const allFeatures = await getAllFeatures();
  const scored = allFeatures.map((f) => {
    let score = 0;
    // エリアマッチ
    if (favAreas.some((a) => f.area.includes(a) || a.includes(f.area))) {
      score += 3;
    }
    // タグマッチ
    for (const tag of f.tags) {
      if (favOccasions.some((o) => tag.toLowerCase().includes(o))) {
        score += 1;
      }
    }
    return { feature: f, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const recommendedFeatures = scored.slice(0, 3).map((s) => s.feature);

  // メッセージ生成
  const cityLabel = favCities[0] || "いろいろな街";
  const message = totalDates >= 5
    ? `${cityLabel}のデートが多いですね！新しいエリアも試してみませんか？`
    : `${totalDates}回のデート履歴をもとに、おすすめを選びました。`;

  return {
    recommendedCities: favCities,
    recommendedAreas: favAreas,
    recommendedFeatures,
    message,
    preferences: prefs,
  };
}
