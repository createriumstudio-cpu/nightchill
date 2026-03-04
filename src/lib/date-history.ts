/**
 * Phase 5: Date history CRUD with auto-preference recalculation
 *
 * デート履歴の保存・取得・削除 + ユーザー嗜好の自動再計算。
 */

import { getDb } from "./db";
import { dateHistory, userPreferences } from "./schema";
import { eq, desc } from "drizzle-orm";
import type { DatePlan } from "./types";

export interface DateHistoryEntry {
  id: number;
  anonId: string;
  city: string;
  area: string;
  occasion: string;
  mood: string;
  budget: string;
  planTitle: string;
  planData: DatePlan;
  createdAt: string;
}

/**
 * デート履歴を保存
 */
export async function saveToHistory(
  anonId: string,
  plan: DatePlan,
  context: { city: string; area: string; occasion: string; mood: string; budget: string },
): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  const result = await db.insert(dateHistory).values({
    anonId,
    city: context.city,
    area: context.area,
    occasion: context.occasion,
    mood: context.mood,
    budget: context.budget,
    planTitle: plan.title,
    planData: plan,
  }).returning({ id: dateHistory.id });

  // 嗜好を自動再計算
  await recalculatePreferences(anonId);

  return result[0]?.id ?? null;
}

/**
 * ユーザーのデート履歴を取得（新しい順）
 */
export async function getHistory(anonId: string, limit = 20): Promise<DateHistoryEntry[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(dateHistory)
    .where(eq(dateHistory.anonId, anonId))
    .orderBy(desc(dateHistory.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    anonId: r.anonId,
    city: r.city,
    area: r.area,
    occasion: r.occasion,
    mood: r.mood,
    budget: r.budget,
    planTitle: r.planTitle,
    planData: r.planData as DatePlan,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

/**
 * 履歴を削除
 */
export async function deleteHistoryEntry(anonId: string, entryId: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  const result = await db
    .delete(dateHistory)
    .where(eq(dateHistory.id, entryId))
    .returning({ id: dateHistory.id });

  if (result.length > 0) {
    await recalculatePreferences(anonId);
  }
  return result.length > 0;
}

/**
 * 履歴から嗜好を自動再計算して userPreferences に保存
 */
async function recalculatePreferences(anonId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const history = await db
    .select()
    .from(dateHistory)
    .where(eq(dateHistory.anonId, anonId))
    .orderBy(desc(dateHistory.createdAt))
    .limit(50);

  if (history.length === 0) return;

  // 頻度カウント
  const cityCount: Record<string, number> = {};
  const areaCount: Record<string, number> = {};
  const occasionCount: Record<string, number> = {};
  const moodCount: Record<string, number> = {};
  const budgetCount: Record<string, number> = {};

  for (const h of history) {
    cityCount[h.city] = (cityCount[h.city] || 0) + 1;
    areaCount[h.area] = (areaCount[h.area] || 0) + 1;
    occasionCount[h.occasion] = (occasionCount[h.occasion] || 0) + 1;
    moodCount[h.mood] = (moodCount[h.mood] || 0) + 1;
    budgetCount[h.budget] = (budgetCount[h.budget] || 0) + 1;
  }

  const topN = (counts: Record<string, number>, n: number) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);

  const prefs = {
    favoriteCities: topN(cityCount, 3),
    favoriteAreas: topN(areaCount, 5),
    favoriteOccasions: topN(occasionCount, 3),
    favoriteMoods: topN(moodCount, 2),
    typicalBudget: topN(budgetCount, 1)[0] || "medium",
    totalDates: history.length,
  };

  // upsert
  const existing = await db.select().from(userPreferences).where(eq(userPreferences.anonId, anonId)).limit(1);
  if (existing.length > 0) {
    await db.update(userPreferences).set({
      preferences: prefs,
      updatedAt: new Date(),
    }).where(eq(userPreferences.anonId, anonId));
  } else {
    await db.insert(userPreferences).values({
      anonId,
      preferences: prefs,
    });
  }
}

/**
 * ユーザーの嗜好を取得
 */
export async function getUserPreferences(anonId: string): Promise<Record<string, unknown> | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db.select().from(userPreferences).where(eq(userPreferences.anonId, anonId)).limit(1);
  return (rows[0]?.preferences as Record<string, unknown>) ?? null;
}
