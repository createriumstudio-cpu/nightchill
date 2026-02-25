import { NextResponse } from "next/server";
import { generateDatePlan } from "@/lib/planner";
import { generateAIPlan } from "@/lib/ai-planner";
import type { PlanRequest, Mood, Budget, AgeGroup } from "@/lib/types";

const validMoods: Mood[] = ["romantic", "fun", "relaxed", "luxurious", "adventurous"];
const validBudgets: Budget[] = ["low", "medium", "high", "unlimited"];
const validAgeGroups: AgeGroup[] = ["under-20", "20-plus"];

function sanitizeText(text: string, maxLength: number): string {
  return text.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimitMap();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。1分後に再試行してください。" },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.activities || !Array.isArray(body.activities) || body.activities.length === 0) {
      return NextResponse.json(
        { error: "やりたいことを1つ以上選択してください" },
        { status: 400 },
      );
    }
    if (!body.mood || !validMoods.includes(body.mood)) {
      return NextResponse.json(
        { error: "雰囲気を選択してください" },
        { status: 400 },
      );
    }
    if (!body.budget || !validBudgets.includes(body.budget)) {
      return NextResponse.json(
        { error: "予算を選択してください" },
        { status: 400 },
      );
    }
    if (!body.ageGroup || !validAgeGroups.includes(body.ageGroup)) {
      return NextResponse.json(
        { error: "年齢確認が必要です" },
        { status: 400 },
      );
    }

    const sanitizedRequest: PlanRequest = {
      dateStr: sanitizeText(body.dateStr || "", 20),
      endDateStr: sanitizeText(body.endDateStr || "", 20),
      startTime: sanitizeText(body.startTime || "", 10),
      endTime: sanitizeText(body.endTime || "", 10),
      location: sanitizeText(body.location || "東京", 50),
      relationship: body.relationship || "lover",
      activities: body.activities,
      mood: body.mood,
      budget: body.budget,
      ageGroup: body.ageGroup,
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
