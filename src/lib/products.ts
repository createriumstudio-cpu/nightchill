/**
 * 自社商材のコンテキストマッチングロジック
 *
 * デートプランの文脈（シチュエーション・雰囲気・予算）に基づいて
 * 最適な商品を自然にレコメンドする。
 *
 * 原則: バナー広告は厳禁。ユーザーの体験を損なわない文脈連動型のみ。
 */

import { getDb } from "./db";
import { products } from "./schema";
import { eq } from "drizzle-orm";
import type { Activity, Mood, Budget } from "./types";

export type ProductCategory =
  | "breath-care"
  | "conversation-card"
  | "gift"
  | "experience"
  | "fashion"
  | "other";

export interface ProductRecommendation {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  relevanceReason: string; // なぜこの商品がおすすめなのか
}

/**
 * プラン文脈に基づく商品レコメンデーション
 *
 * マッチング優先度:
 * 1. occasion + mood + budget 全マッチ
 * 2. occasion + mood マッチ
 * 3. occasion のみマッチ
 * 4. mood のみマッチ
 */
export async function findRecommendedProducts(
  occasion: Activity,
  mood: Mood,
  budget: Budget,
  limit: number = 2,
): Promise<ProductRecommendation[]> {
  const db = getDb();
  if (!db) return [];

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  if (allProducts.length === 0) return [];

  // スコアリング
  const scored = allProducts.map((product) => {
    let score = 0;
    let reason = "";

    const targetOccasions = (product.targetOccasions as string[]) || [];
    const targetMoods = (product.targetMoods as string[]) || [];
    const targetBudgets = (product.targetBudgets as string[]) || [];

    const occasionMatch =
      targetOccasions.length === 0 || targetOccasions.includes(occasion);
    const moodMatch =
      targetMoods.length === 0 || targetMoods.includes(mood);
    const budgetMatch =
      targetBudgets.length === 0 || targetBudgets.includes(budget);

    if (occasionMatch && moodMatch && budgetMatch) {
      score = 3;
      reason = "このデートにぴったりのアイテム";
    } else if (occasionMatch && moodMatch) {
      score = 2;
      reason = "このシーンにおすすめ";
    } else if (occasionMatch) {
      score = 1;
      reason = "デートをもっと楽しくするアイテム";
    } else if (moodMatch) {
      score = 1;
      reason = "今の雰囲気にぴったり";
    }

    return { product, score, reason };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.product.sortOrder ?? 0) - (b.product.sortOrder ?? 0);
    })
    .slice(0, limit)
    .map((s) => ({
      id: s.product.id,
      slug: s.product.slug,
      name: s.product.name,
      shortDescription: s.product.shortDescription,
      price: s.product.price,
      imageUrl: s.product.imageUrl,
      category: s.product.category,
      relevanceReason: s.reason,
    }));
}

/**
 * 商品をslugで取得
 */
export async function getProductBySlug(slug: string) {
  const db = getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  return result[0] || null;
}

/**
 * 公開中の全商品を取得
 */
export async function getActiveProducts() {
  const db = getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true));
}
