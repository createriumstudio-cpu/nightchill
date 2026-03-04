import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/user-auth";
import { saveToHistory, getHistory, deleteHistoryEntry } from "@/lib/date-history";

/**
 * GET /api/history — デート履歴一覧取得
 */
export async function GET(request: Request) {
  const anonId = getUserIdFromRequest(request);
  if (!anonId) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  try {
    const history = await getHistory(anonId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("[api/history] GET error:", error);
    return NextResponse.json({ error: "履歴の取得に失敗しました" }, { status: 500 });
  }
}

/**
 * POST /api/history — デート履歴を保存
 */
export async function POST(request: Request) {
  const anonId = getUserIdFromRequest(request);
  if (!anonId) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { plan, context } = body;

    if (!plan || !context) {
      return NextResponse.json({ error: "plan と context が必要です" }, { status: 400 });
    }

    const id = await saveToHistory(anonId, plan, {
      city: context.city || "tokyo",
      area: context.area || "",
      occasion: context.occasion || "",
      mood: context.mood || "",
      budget: context.budget || "",
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[api/history] POST error:", error);
    return NextResponse.json({ error: "履歴の保存に失敗しました" }, { status: 500 });
  }
}

/**
 * DELETE /api/history — 履歴エントリ削除
 */
export async function DELETE(request: Request) {
  const anonId = getUserIdFromRequest(request);
  if (!anonId) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entryId = parseInt(searchParams.get("id") || "", 10);
    if (isNaN(entryId)) {
      return NextResponse.json({ error: "id パラメータが必要です" }, { status: 400 });
    }

    const deleted = await deleteHistoryEntry(anonId, entryId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("[api/history] DELETE error:", error);
    return NextResponse.json({ error: "履歴の削除に失敗しました" }, { status: 500 });
  }
}
