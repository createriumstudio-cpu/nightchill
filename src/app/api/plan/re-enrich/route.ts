import { NextResponse } from "next/server";
import { getPlanBySlug, updatePlanContent } from "@/lib/plans";
import { searchVenue } from "@/lib/google-places";
import type { VenueFactData } from "@/lib/google-places";
import { getWalkingRoute } from "@/lib/google-maps";

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
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
    const slug = body.slug;
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const saved = await getPlanBySlug(slug);
    if (!saved) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const plan = saved.plan;

    // fallback venues を再検索
    const fallbackVenues = (plan.venues || []).filter(v => v.source === "fallback");
    if (fallbackVenues.length === 0) {
      return NextResponse.json({ message: "No fallback venues to re-enrich", plan });
    }

    const area = saved.location || saved.city || "東京";
    const updatedVenues: VenueFactData[] = [];
    const venueMap = new Map<string, VenueFactData>();

    // 全 fallback venues を並列で再検索
    const searchResults = await Promise.all(
      fallbackVenues.map(v => {
        const item = plan.timeline.find(t => t.venue === v.name);
        return searchVenue(v.name, area, item?.activity);
      })
    );

    for (let i = 0; i < fallbackVenues.length; i++) {
      const result = searchResults[i];
      if (result && result.source === "google_places") {
        venueMap.set(fallbackVenues[i].name, result);
        updatedVenues.push(result);
      } else {
        // 検索失敗 → 元のfallbackを保持
        updatedVenues.push(fallbackVenues[i]);
      }
    }

    // 既存の google_places venues を保持しつつ、更新分をマージ
    const existingGoogleVenues = (plan.venues || []).filter(v => v.source === "google_places");
    plan.venues = [...existingGoogleVenues, ...updatedVenues];

    // timeline の description を更新
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

    // 徒歩ルート更新
    const googleVenues = plan.venues.filter(v => v.source === "google_places");
    if (!plan.walkingRoute && googleVenues.length >= 2 && googleVenues[0].lat !== 0 && googleVenues[1].lat !== 0) {
      plan.walkingRoute = (await getWalkingRoute(
        { lat: googleVenues[0].lat, lng: googleVenues[0].lng },
        { lat: googleVenues[1].lat, lng: googleVenues[1].lng },
      )) ?? undefined;
    }

    // DB に保存
    await updatePlanContent(slug, plan);

    return NextResponse.json({ message: "Re-enrichment complete", plan });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
