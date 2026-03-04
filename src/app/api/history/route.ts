import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-auth";
import {
  saveToHistory,
  getUserHistory,
  rateDateHistory,
} from "@/lib/date-history";

/** GET /api/history — Get user's date history */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ history: [] });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const history = await getUserHistory(user.id, limit);
  return NextResponse.json({ history });
}

/** POST /api/history — Save plan to history or rate a plan */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "save") {
      const result = await saveToHistory({
        userId: user.id,
        planSlug: body.planSlug,
        title: body.title || "無題のプラン",
        city: body.city,
        location: body.location,
        occasion: body.occasion,
        mood: body.mood,
        budget: body.budget,
        relationship: body.relationship,
        planSummary: body.planSummary,
        venueNames: body.venueNames,
      });

      if (!result) {
        return NextResponse.json(
          { error: "履歴の保存に失敗しました" },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, id: result.id });
    }

    if (action === "rate") {
      const historyId = body.historyId as number;
      const rating = body.rating as number;
      const feedback = body.feedback as string | undefined;

      if (!historyId || !rating) {
        return NextResponse.json(
          { error: "historyIdとratingは必須です" },
          { status: 400 },
        );
      }

      const ok = await rateDateHistory(historyId, user.id, rating, feedback);
      if (!ok) {
        return NextResponse.json(
          { error: "評価の保存に失敗しました" },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "不正なアクション" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
