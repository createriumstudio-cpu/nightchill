import { NextRequest, NextResponse } from "next/server";
import { findAffiliateVenues } from "@/lib/affiliate";
import type { Activity, Mood } from "@/lib/types";

/**
 * GET /api/affiliate-venues — 文脈連動型アフィリエイト店舗レコメンド
 *
 * Query params:
 *   city (required) — 都市ID
 *   occasion — Activity
 *   mood — Mood
 *   limit — 表示件数 (default: 2)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const occasion = searchParams.get("occasion") as Activity | null;
  const mood = searchParams.get("mood") as Mood | null;
  const limit = Number(searchParams.get("limit")) || 2;

  if (!city) {
    return NextResponse.json(
      { error: "city parameter is required" },
      { status: 400 },
    );
  }

  if (!occasion || !mood) {
    return NextResponse.json([], { status: 200 });
  }

  const venues = await findAffiliateVenues(city, occasion, mood, limit);
  return NextResponse.json(venues);
}
