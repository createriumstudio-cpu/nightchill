import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { linkGoogleAccount } from "@/lib/user-auth";

/**
 * POST /api/auth/link — Googleアカウントと匿名ユーザーをリンク
 *
 * NextAuthセッションが必要。ログイン後にクライアントから呼ばれ、
 * 現在のCookie anonId にGoogle情報を紐付ける。
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const { anonId, linked } = await linkGoogleAccount(
      session.user.id,
      session.user.email || null,
      session.user.name || null,
    );

    return NextResponse.json({ anonId, linked });
  } catch (error) {
    console.error("[api/auth/link] Error:", error);
    return NextResponse.json({ error: "アカウントリンクに失敗しました" }, { status: 500 });
  }
}
