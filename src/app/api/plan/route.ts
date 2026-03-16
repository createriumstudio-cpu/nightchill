import { NextResponse } from "next/server";
import { generateDatePlan } from "@/lib/planner";
import { generateAIPlan } from "@/lib/ai-planner";
import { generateGeminiPlan } from "@/lib/gemini-planner";
import { savePlan } from "@/lib/plans";
import { saveToHistory } from "@/lib/date-history";
import { getUserIdFromRequest } from "@/lib/user-auth";
import type { PlanRequest, DatePlan, Activity, Mood, Budget, AgeGroup } from "@/lib/types";
import { CITY_IDS, getCityById } from "@/lib/cities";
import { batchSearchVenuesWithGemini } from "@/lib/gemini-search";
import type { VenueFactData } from "@/lib/google-places";
import { getWalkingRoute } from "@/lib/google-maps";

const validActivities: Activity[] = ["birthday", "anniversary", "lunch", "dinner", "cafe", "shopping", "active", "nightlife", "chill", "travel"];
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

/**
 * テンプレートプランのvenue名でGemini Search grounding検索し、ファクトデータを付与する。
 */
async function enrichTemplatePlan(plan: DatePlan, request: PlanRequest): Promise<DatePlan> {
  const cityData = getCityById(request.city || "tokyo");
  const cityName = cityData?.searchName || "東京";
  const area = request.location || cityName;

  // venue名の一覧（空文字を除外）
  const venueItems = plan.timeline
    .filter(t => t.venue.length > 0)
    .map(t => ({ name: t.venue, activity: t.activity }));
  const uniqueVenues = venueItems.filter(
    (v, i, arr) => arr.findIndex(a => a.name === v.name) === i,
  );
  if (uniqueVenues.length === 0) return plan;

  try {
    // Gemini Search grounding でバッチ検索
    const venueMap = await batchSearchVenuesWithGemini(uniqueVenues, area);

    const venues: VenueFactData[] = [];
    for (const v of uniqueVenues) {
      const data = venueMap.get(v.name);
      if (data) venues.push(data);
    }

    // タイムラインの description をファクトデータで上書き
    for (const item of plan.timeline) {
      const venueData = venueMap.get(item.venue);
      if (venueData) {
        const parts: string[] = [];
        if (venueData.rating !== null) parts.push(`★${venueData.rating}`);
        if (venueData.priceLevel !== null) parts.push("¥".repeat(venueData.priceLevel || 1));
        parts.push(venueData.address);
        item.description = parts.join(" | ");
      }
    }

    // 徒歩ルート取得（最初と2番目の店舗間）
    let walkingRoute = plan.walkingRoute;
    if (venues.length >= 2) {
      walkingRoute = (await getWalkingRoute(
        venues[0].name + " " + area,
        venues[1].name + " " + area,
      )) ?? undefined;
    }

    return {
      ...plan,
      venues,
      walkingRoute,
    };
  } catch (error) {
    console.error("[api/plan] Template enrichment failed:", error);
    return plan;
  }
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
    const sanitizedActivities = (body.activities as string[]).filter(
      (a): a is Activity => validActivities.includes(a as Activity),
    );
    if (sanitizedActivities.length === 0) {
      return NextResponse.json(
        { error: "有効なやりたいことを1つ以上選択してください" },
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

    // Validate city (default to "tokyo" for backward compatibility)
    const cityId = CITY_IDS.includes(body.city) ? body.city : "tokyo";

    const sanitizedRequest: PlanRequest = {
      dateStr: sanitizeText(body.dateStr || "", 20),
      endDateStr: sanitizeText(body.endDateStr || "", 20),
      startTime: sanitizeText(body.startTime || "", 10),
      endTime: sanitizeText(body.endTime || "", 10),
      city: cityId,
      location: sanitizeText(body.location || "", 50),
      relationship: body.relationship || "lover",
      activities: sanitizedActivities,
      mood: body.mood,
      budget: body.budget,
      ageGroup: body.ageGroup,
      additionalNotes: sanitizeText(body.additionalNotes || "", 500),
    };

    // フォールバックチェーン: 1. Gemini → 2. Anthropic → 3. テンプレート
    let plan;
    if (process.env.GEMINI_API_KEY) {
      try {
        plan = await generateGeminiPlan(sanitizedRequest);
      } catch (geminiError) {
        console.warn("[api/plan] Gemini failed:", (geminiError as Error).message);
      }
    }

    if (!plan && process.env.ANTHROPIC_API_KEY) {
      try {
        plan = await generateAIPlan(sanitizedRequest);
      } catch (aiError) {
        console.warn("[api/plan] Anthropic failed:", (aiError as Error).message);
      }
    }

    if (!plan) {
      console.log("[api/plan] All AI providers failed, using template fallback");
      plan = generateDatePlan(sanitizedRequest);
      plan = await enrichTemplatePlan(plan, sanitizedRequest);
    }

    const slug = await savePlan(plan, sanitizedRequest.city, sanitizedRequest.location);

    // Auto-save to history (best-effort, don't block response)
    try {
      const anonId = getUserIdFromRequest(request);
      if (anonId) {
        await saveToHistory(anonId, plan, {
          city: sanitizedRequest.city,
          area: sanitizedRequest.location,
          occasion: sanitizedRequest.relationship || "",
          mood: sanitizedRequest.mood || "",
          budget: sanitizedRequest.budget || "",
        });
      }
    } catch (historyError) {
      console.error("[api/plan] Auto-save to history failed:", historyError);
    }

    return NextResponse.json({ ...plan, slug });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
