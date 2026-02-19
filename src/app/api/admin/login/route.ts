import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  generateToken,
  ADMIN_COOKIE_NAME,
  isAdminEnabled,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { error: "管理画面は無効です。ADMIN_PASSWORD を設定してください。" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || !verifyPassword(password)) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 401 }
      );
    }

    const token = generateToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "リクエストが不正です" },
      { status: 400 }
    );
  }
}
