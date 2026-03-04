import { NextResponse } from "next/server";
import {
  getCurrentUser,
  createAnonymousUser,
  updateUserProfile,
} from "@/lib/user-auth";

/** GET /api/auth — Get current user (or null) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, nickname: user.nickname },
  });
}

/** POST /api/auth — Create anonymous user or update profile */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      // Create new anonymous user
      const user = await createAnonymousUser();
      if (!user) {
        return NextResponse.json(
          { error: "ユーザー作成に失敗しました（DB未設定の可能性）" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        user: { id: user.id, email: user.email, nickname: user.nickname },
      });
    }

    if (action === "update") {
      const current = await getCurrentUser();
      if (!current) {
        return NextResponse.json(
          { error: "ログインしてください" },
          { status: 401 },
        );
      }
      const updated = await updateUserProfile(current.id, {
        email: body.email,
        nickname: body.nickname,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "プロフィール更新に失敗しました" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        user: {
          id: updated.id,
          email: updated.email,
          nickname: updated.nickname,
        },
      });
    }

    return NextResponse.json({ error: "不正なアクション" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
