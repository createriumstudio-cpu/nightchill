import { NextResponse } from "next/server";
import { generateDatePlan } from "@/lib/planner";
import { generateAIPlan } from "@/lib/ai-planner";
import type { PlanRequest, Occasion, Mood, Budget } from "@/lib/types";

const validOccasions: Occasion[] = [
  "first-date",
  "anniversary",
  "birthday",
  "proposal",
  "casual",
  "makeup",
];
const validMoods: Mood[] = [
  "romantic",
  "fun",
  "relaxed",
  "luxurious",
  "adventurous",
];
const validBudgets: Budget[] = ["low", "medium", "high", "unlimited"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequest;

    if (!body.occasion || !validOccasions.includes(body.occasion)) {
      return NextResponse.json(
        { error: "有効なシチュエーションを選択してください" },
        { status: 400 },
      );
    }
    if (!body.mood || !validMoods.includes(body.mood)) {
      return NextResponse.json(
        { error: "有効な雰囲気を選択してください" },
        { status: 400 },
      );
    }
    if (!body.budget || !validBudgets.includes(body.budget)) {
      return NextResponse.json(
        { error: "有効な予算を選択してください" },
        { status: 400 },
      );
    }

    // Use AI if API key is configured, otherwise fall back to templates
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const plan = await generateAIPlan(body);
        return NextResponse.json(plan);
      } catch (aiError) {
        console.error("AI plan generation failed, falling back to template:", aiError);
      }
    }

    const plan = generateDatePlan(body);
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
