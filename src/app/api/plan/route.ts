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

// Simple in-memory rate limiting (per IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function sanitizeText(input: string, maxLength: number): string {
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく待ってからお試しください。" },
        { status: 429 },
      );
    }

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

    // Sanitize free-text inputs
    const sanitizedRequest: PlanRequest = {
      occasion: body.occasion,
      mood: body.mood,
      budget: body.budget,
      location: sanitizeText(body.location || "東京", 50),
      partnerInterests: sanitizeText(body.partnerInterests || "", 200),
      additionalNotes: sanitizeText(body.additionalNotes || "", 500),
    };

    // Use AI if API key is configured, otherwise fall back to templates
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const plan = await generateAIPlan(sanitizedRequest);
        return NextResponse.json(plan);
      } catch (aiError) {
        console.error("AI plan generation failed, falling back to template:", aiError);
      }
    }

    const plan = generateDatePlan(sanitizedRequest);
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
