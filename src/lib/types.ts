import type { VenueFactData } from "./google-places";
import type { WalkingRoute } from "./google-maps";

// ── 誰と？ ──
export type Relationship = "lover" | "spouse" | "not-yet";

// ── 何をしたい？（複数選択可） ──
export type Activity =
  | "birthday"
  | "anniversary"
  | "lunch"
  | "dinner"
  | "cafe"
  | "shopping"
  | "active"
  | "nightlife"
  | "chill"
  | "travel";

// ── 予算 ──
export type Budget = "low" | "medium" | "high" | "unlimited";

// ── 年齢確認 ──
export type AgeGroup = "under-20" | "20-plus";

// ── 雰囲気 ──
export type Mood = "romantic" | "fun" | "relaxed" | "luxurious" | "adventurous";

// ── フォームリクエスト ──
export interface PlanRequest {
  // いつ？
  dateStr: string;         // "2026-02-28" or "" (undecided)
  endDateStr: string;    // "2026-03-01" or "" (same day / undecided)
  startTime: string;       // "11:00" or ""
  endTime: string;         // "21:00" or ""
  // どこで？
  location: string;        // free text: "渋谷", "決まってない", etc.
  // 誰と？
  relationship: Relationship;
  // 何をしたい？
  activities: Activity[];
  // 条件
  mood: Mood;
  budget: Budget;
  ageGroup: AgeGroup;
  // 自由記述
  additionalNotes: string;
}

// ── レスポンス ──
export interface TimelineItem {
  time: string;
  activity: string;
  venue: string;
  description: string;
  tip: string;
}

export interface DatePlan {
  id: string;
  title: string;
  summary: string;
  timeline: TimelineItem[];
  fashionAdvice: string;
  conversationTopics: string[];
  warnings: string[];
  // Phase 1: ファクトデータ & ルート情報
  venues?: VenueFactData[];
  walkingRoute?: WalkingRoute;
}

// ── ラベル定義 ──
export const relationshipLabels: Record<Relationship, string> = {
  lover: "恋人",
  spouse: "夫婦",
  "not-yet": "まだ友達",
};

export const activityLabels: Record<Activity, string> = {
  birthday: "誕生日",
  anniversary: "記念日",
  lunch: "ランチ",
  dinner: "ディナー",
  cafe: "カフェ巡り",
  shopping: "ショッピング",
  active: "アクティブ",
  nightlife: "バー・夜遊び",
  chill: "まったり",
  travel: "おでかけ・旅行",
};

export const moodLabels: Record<Mood, string> = {
  romantic: "ロマンチック",
  fun: "楽しい",
  relaxed: "リラックス",
  luxurious: "ラグジュアリー",
  adventurous: "アドベンチャー",
};

export const budgetLabels: Record<Budget, string> = {
  low: "〜5,000円",
  medium: "5,000〜15,000円",
  high: "15,000〜30,000円",
  unlimited: "予算は気にしない",
};

export const ageGroupLabels: Record<AgeGroup, string> = {
  "under-20": "20歳未満",
  "20-plus": "20歳以上",
};

// ── 後方互換（他ファイルが参照する旧型） ──
export type Occasion = Activity;
export type DateType = "dinner-only" | "half-day" | "full-day" | "overnight";
export type DateSchedule = "today" | "tomorrow" | "this-weekend" | "next-week" | "undecided";
export const occasionLabels = activityLabels;
export const dateTypeLabels: Record<DateType, string> = {
  "dinner-only": "食事のみ",
  "half-day": "半日デート",
  "full-day": "終日デート",
  overnight: "お泊まりデート",
};
export const dateScheduleLabels: Record<DateSchedule, string> = {
  today: "今日",
  tomorrow: "明日",
  "this-weekend": "今週末",
  "next-week": "来週",
  undecided: "未定",
};
