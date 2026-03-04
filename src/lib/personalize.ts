import { getUserPreferences, getUserHistory } from "./date-history";
import { CITIES } from "./cities";
import type { Activity, Mood, Budget } from "./types";

export interface PersonalizedSuggestion {
  suggestedCity: string | null;
  suggestedActivities: Activity[];
  suggestedMood: Mood | null;
  suggestedBudget: Budget | null;
  message: string;
  stats: {
    totalPlans: number;
    averageRating: number | null;
    favoriteCity: string | null;
  };
}

/** Generate personalized suggestions from user's past data */
export async function getPersonalizedSuggestions(
  userId: number,
): Promise<PersonalizedSuggestion> {
  const prefs = await getUserPreferences(userId);
  const history = await getUserHistory(userId, 5);

  if (!prefs || prefs.totalPlans === 0) {
    return {
      suggestedCity: null,
      suggestedActivities: [],
      suggestedMood: null,
      suggestedBudget: null,
      message: "まだデート履歴がありません。最初のプランを作ってみましょう！",
      stats: { totalPlans: 0, averageRating: null, favoriteCity: null },
    };
  }

  const preferredCities = (prefs.preferredCities as string[]) || [];
  const preferredMoods = (prefs.preferredMoods as string[]) || [];
  const preferredBudgets = (prefs.preferredBudgets as string[]) || [];
  const preferredActivities = (prefs.preferredActivities as string[]) || [];

  // Suggest a city the user hasn't tried much, or their favorite
  const recentCities = new Set(
    history.map((h) => h.city).filter(Boolean) as string[],
  );
  const allCityIds = CITIES.map((c) => c.id);
  const untriedCities = allCityIds.filter((c) => !recentCities.has(c));

  // If user has visited < 3 cities, suggest a new one; otherwise suggest their favorite
  let suggestedCity: string | null = null;
  if (untriedCities.length > 0 && (prefs.totalPlans ?? 0) >= 3) {
    // Suggest an untried city for variety
    suggestedCity =
      untriedCities[Math.floor(Math.random() * untriedCities.length)];
  } else {
    suggestedCity = preferredCities[0] ?? null;
  }

  const suggestedMood = (preferredMoods[0] as Mood) ?? null;
  const suggestedBudget = (preferredBudgets[0] as Budget) ?? null;
  const suggestedActivities = preferredActivities.slice(0, 3) as Activity[];

  // Generate message
  const avgRating = prefs.averageRating
    ? (prefs.averageRating / 10).toFixed(1)
    : null;
  const favoriteCity = preferredCities[0]
    ? CITIES.find((c) => c.id === preferredCities[0])?.name
    : null;

  let message: string;
  if ((prefs.totalPlans ?? 0) >= 5) {
    message = `${prefs.totalPlans}回のデートプランを作成しています。${favoriteCity ? `${favoriteCity}がお気に入りですね。` : ""}${suggestedCity && suggestedCity !== preferredCities[0] ? `今度は${CITIES.find((c) => c.id === suggestedCity)?.name ?? suggestedCity}はいかが？` : ""}`;
  } else if ((prefs.totalPlans ?? 0) >= 2) {
    message = `${prefs.totalPlans}回のデートプランを作成しました。好みが見えてきました！`;
  } else {
    message = "デートプランの履歴からあなたの好みを学習中です。";
  }

  return {
    suggestedCity,
    suggestedActivities,
    suggestedMood,
    suggestedBudget,
    message,
    stats: {
      totalPlans: prefs.totalPlans ?? 0,
      averageRating: avgRating ? parseFloat(avgRating) : null,
      favoriteCity: favoriteCity ?? null,
    },
  };
}
