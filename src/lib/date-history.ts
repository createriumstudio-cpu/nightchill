import { getDb } from "./db";
import { dateHistory, userPreferences } from "./schema";
import { eq, desc, sql } from "drizzle-orm";

export interface SaveHistoryInput {
  userId: number;
  planSlug?: string;
  title: string;
  city?: string;
  location?: string;
  occasion?: string;
  mood?: string;
  budget?: string;
  relationship?: string;
  planSummary?: string;
  venueNames?: string[];
}

export interface HistoryEntry {
  id: number;
  planSlug: string | null;
  title: string;
  city: string | null;
  location: string | null;
  occasion: string | null;
  mood: string | null;
  budget: string | null;
  planSummary: string | null;
  venueNames: string[];
  rating: number | null;
  feedback: string | null;
  dateUsed: Date | null;
  createdAt: Date | null;
}

/** Save a plan to user's date history */
export async function saveToHistory(
  input: SaveHistoryInput,
): Promise<{ id: number } | null> {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .insert(dateHistory)
    .values({
      userId: input.userId,
      planSlug: input.planSlug ?? null,
      title: input.title,
      city: input.city ?? null,
      location: input.location ?? null,
      occasion: input.occasion ?? null,
      mood: input.mood ?? null,
      budget: input.budget ?? null,
      relationship: input.relationship ?? null,
      planSummary: input.planSummary ?? null,
      venueNames: input.venueNames ?? [],
    })
    .returning({ id: dateHistory.id });

  if (rows.length > 0) {
    // Update preferences in background
    await updatePreferencesFromHistory(input.userId).catch(() => {});
  }

  return rows[0] ?? null;
}

/** Get user's date history */
export async function getUserHistory(
  userId: number,
  limit = 20,
): Promise<HistoryEntry[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: dateHistory.id,
      planSlug: dateHistory.planSlug,
      title: dateHistory.title,
      city: dateHistory.city,
      location: dateHistory.location,
      occasion: dateHistory.occasion,
      mood: dateHistory.mood,
      budget: dateHistory.budget,
      planSummary: dateHistory.planSummary,
      venueNames: dateHistory.venueNames,
      rating: dateHistory.rating,
      feedback: dateHistory.feedback,
      dateUsed: dateHistory.dateUsed,
      createdAt: dateHistory.createdAt,
    })
    .from(dateHistory)
    .where(eq(dateHistory.userId, userId))
    .orderBy(desc(dateHistory.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    venueNames: (r.venueNames as string[]) ?? [],
  }));
}

/** Rate a past date */
export async function rateDateHistory(
  historyId: number,
  userId: number,
  rating: number,
  feedback?: string,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  if (rating < 1 || rating > 5) return false;

  const rows = await db
    .update(dateHistory)
    .set({
      rating,
      feedback: feedback ?? null,
    })
    .where(
      sql`${dateHistory.id} = ${historyId} AND ${dateHistory.userId} = ${userId}`,
    )
    .returning({ id: dateHistory.id });

  if (rows.length > 0) {
    await updatePreferencesFromHistory(userId).catch(() => {});
  }

  return rows.length > 0;
}

/** Recalculate user preferences from their full history */
async function updatePreferencesFromHistory(userId: number): Promise<void> {
  const db = getDb();
  if (!db) return;

  const history = await db
    .select({
      city: dateHistory.city,
      mood: dateHistory.mood,
      budget: dateHistory.budget,
      occasion: dateHistory.occasion,
      venueNames: dateHistory.venueNames,
      rating: dateHistory.rating,
      createdAt: dateHistory.createdAt,
    })
    .from(dateHistory)
    .where(eq(dateHistory.userId, userId))
    .orderBy(desc(dateHistory.createdAt));

  if (history.length === 0) return;

  // Count frequencies
  const cityCount = new Map<string, number>();
  const moodCount = new Map<string, number>();
  const budgetCount = new Map<string, number>();
  const activityCount = new Map<string, number>();
  const venueSet = new Set<string>();
  let ratingSum = 0;
  let ratingCount = 0;

  for (const h of history) {
    // Weight highly-rated dates more
    const weight = h.rating && h.rating >= 4 ? 2 : 1;

    if (h.city) cityCount.set(h.city, (cityCount.get(h.city) || 0) + weight);
    if (h.mood) moodCount.set(h.mood, (moodCount.get(h.mood) || 0) + weight);
    if (h.budget)
      budgetCount.set(h.budget, (budgetCount.get(h.budget) || 0) + weight);
    if (h.occasion)
      activityCount.set(
        h.occasion,
        (activityCount.get(h.occasion) || 0) + weight,
      );

    // Collect favorite venues (from highly rated dates)
    if (h.rating && h.rating >= 4 && h.venueNames) {
      for (const v of h.venueNames as string[]) {
        venueSet.add(v);
      }
    }

    if (h.rating) {
      ratingSum += h.rating;
      ratingCount++;
    }
  }

  const topN = <T>(map: Map<T, number>, n: number): T[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);

  const avgRating =
    ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) : null;
  const lastPlanAt = history[0]?.createdAt ?? null;

  // Upsert preferences
  const existing = await db
    .select({ id: userPreferences.id })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const prefData = {
    preferredCities: topN(cityCount, 5),
    preferredMoods: topN(moodCount, 3),
    preferredBudgets: topN(budgetCount, 3),
    preferredActivities: topN(activityCount, 5),
    favoriteVenues: [...venueSet].slice(0, 20),
    totalPlans: history.length,
    averageRating: avgRating,
    lastPlanAt: lastPlanAt,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(userPreferences)
      .set(prefData)
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, ...prefData });
  }
}

/** Get user preferences */
export async function getUserPreferences(userId: number) {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}
