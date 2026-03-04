import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/user-auth";

/**
 * GET /api/auth — 匿名ユーザーIDを取得（なければ自動作成+Cookie設定）
 */
export async function GET() {
  try {
    const { userId, isNew } = await getOrCreateUser();
    return NextResponse.json({ userId, isNew });
  } catch (error) {
    console.error("[api/auth] Error:", error);
    return NextResponse.json({ error: "認証エラー" }, { status: 500 });
  }
}
