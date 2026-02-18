import { NextResponse } from "next/server";
import { generateDatePlan } from "@/lib/planner";
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

    const plan = generateDatePlan(body);

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
