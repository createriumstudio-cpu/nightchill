export type Occasion =
  | "first-date"
  | "anniversary"
  | "birthday"
  | "proposal"
  | "casual"
  | "makeup";

export type Mood = "romantic" | "fun" | "relaxed" | "luxurious" | "adventurous";

export type Budget = "low" | "medium" | "high" | "unlimited";

export interface PlanRequest {
  occasion: Occasion;
  mood: Mood;
  budget: Budget;
  location: string;
  partnerInterests: string;
  additionalNotes: string;
}

export interface TimelineItem {
  time: string;
  activity: string;
  tip: string;
}

export interface DatePlan {
  id: string;
  title: string;
  summary: string;
  occasion: Occasion;
  mood: Mood;
  timeline: TimelineItem[];
  fashionAdvice: string;
  conversationTopics: string[];
  warnings: string[];
}

export const occasionLabels: Record<Occasion, string> = {
  "first-date": "初デート",
  anniversary: "記念日",
  birthday: "誕生日",
  proposal: "プロポーズ",
  casual: "カジュアル",
  makeup: "仲直り",
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
