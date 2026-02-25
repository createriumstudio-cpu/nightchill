import type { PlanRequest, DatePlan, TimelineItem } from "./types";
import { activityLabels, relationshipLabels } from "./types";

// Template-based fallback planner (used when ANTHROPIC_API_KEY is not set)
export function generateDatePlan(request: PlanRequest): DatePlan {
  const area = request.location || "東京";
  const activitiesText = request.activities.map(a => activityLabels[a]).join("・");
  const relationText = relationshipLabels[request.relationship];

  const timeline: TimelineItem[] = [];

  // Build timeline based on activities
  if (request.startTime && request.endTime) {
    const [sh] = request.startTime.split(":").map(Number);
    const [eh] = request.endTime.split(":").map(Number);
    const hours = eh - sh;

    if (hours <= 3) {
      timeline.push(
        { time: request.startTime, activity: `${area}でカフェタイム`, tip: "予約しておくとスムーズ" },
        { time: `${sh + 1}:30`, activity: `${area}周辺を散策`, tip: "写真スポットをチェック" },
      );
    } else {
      timeline.push(
        { time: request.startTime, activity: `${area}エリアで合流`, tip: "早めに到着して余裕を持とう" },
        { time: `${sh + 1}:00`, activity: `${area}のおすすめカフェでランチ`, tip: "人気店は予約がベター" },
        { time: `${sh + 2}:30`, activity: `${area}周辺でショッピング`, tip: "相手の好みに合わせて" },
        { time: `${sh + 4}:00`, activity: "カフェで休憩", tip: "疲れたら無理せず休もう" },
      );
      if (hours >= 6) {
        timeline.push(
          { time: `${eh - 2}:00`, activity: `${area}のレストランでディナー`, tip: "予約は必須" },
        );
      }
    }
  } else {
    // Default 4-spot plan
    timeline.push(
      { time: "12:00", activity: `${area}で待ち合わせ・ランチ`, tip: "おしゃれなお店を選ぼう" },
      { time: "14:00", activity: `${area}エリアを散策`, tip: "天気をチェックして" },
      { time: "16:00", activity: "カフェでまったり", tip: "会話を楽しむ時間に" },
      { time: "18:30", activity: `${area}のレストランでディナー`, tip: "予約しておくと安心" },
    );
  }

  return {
    id: `plan-${Date.now()}`,
    title: `${area}${activitiesText}デート`,
    summary: `${relationText}と${area}で${activitiesText}を楽しむプランです。`,
    timeline,
    fashionAdvice: "きれいめカジュアルがおすすめ。歩きやすい靴を忘れずに。",
    conversationTopics: [
      "最近ハマっていること",
      "行ってみたい場所",
      "おすすめの映画や音楽",
    ],
    warnings: request.ageGroup === "under-20"
      ? ["20歳未満のためアルコール提供店は含まれていません"]
      : [],
  };
}
