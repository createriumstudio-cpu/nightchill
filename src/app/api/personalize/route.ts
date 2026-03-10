import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/user-auth";
import { getPersonalizedRecommendations } from "@/lib/personalize";

/**
 * GET /api/personalize — パーソナライズされた推薦を取得
 */
export async function GET(request: Request) {
  const anonId = await resolveUserId(request);
  if (!anonId) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  try {
    const recommendations = await getPersonalizedRecommendations(anonId);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("[api/personalize] Error:", error);
    return NextResponse.json({ error: "パーソナライゼーションに失敗しました" }, { status: 500 });
  }
}
