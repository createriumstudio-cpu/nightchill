/**
 * 今週のおすすめデートプラン
 *
 * 週番号に基づいて自動ローテーションするピックシステム。
 * weekly-picks.json の8テーマを毎週切り替え（8週サイクル）。
 */

import weeklyPicksData from "@/data/weekly-picks.json";

export interface WeeklyPick {
  cityId: string;
  area: string;
  title: string;
  subtitle: string;
  mood: string;
  timeOfDay: "daytime" | "evening" | "allday";
  featureSlug: string | null;
}

export interface WeeklyPickSet {
  id: string;
  theme: string;
  themeEmoji: string;
  description: string;
  picks: WeeklyPick[];
}

const pickSets: WeeklyPickSet[] = weeklyPicksData as WeeklyPickSet[];

/**
 * ISO週番号を取得（月曜始まり）
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // 最も近い木曜日に合わせる (ISO 8601)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * 今週の月曜日の日付を取得
 */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 今週のおすすめを取得
 */
export function getCurrentWeeklyPicks(now?: Date): WeeklyPickSet {
  const date = now ?? new Date();
  const weekNum = getISOWeekNumber(date);
  const index = weekNum % pickSets.length;
  return pickSets[index];
}

/**
 * 都市IDでフィルタした今週のおすすめを取得
 */
export function getWeeklyPicksForCity(cityId: string, now?: Date): WeeklyPick[] {
  const current = getCurrentWeeklyPicks(now);
  return current.picks.filter((p) => p.cityId === cityId);
}

/**
 * 今週の期間表示用テキストを取得 (例: "3/2 〜 3/8")
 */
export function getWeekRangeLabel(now?: Date): string {
  const date = now ?? new Date();
  const monday = getWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(monday)} 〜 ${fmt(sunday)}`;
}

/**
 * 全ピックセットを取得（プレビュー用）
 */
export function getAllWeeklyPickSets(): WeeklyPickSet[] {
  return pickSets;
}
