/**
 * GET /api/sns/scheduled
 *
 * 未投稿（status='generated'）のSNSコンテンツ一覧を返す。
 * Make/Zapierのポーリングトリガーや管理画面から利用。
 *
 * 認証: Bearer token (環境変数 SNS_WEBHOOK_SECRET)
 */

import { NextResponse } from "next/server";
import { authenticateWebhook, getScheduledContents } from "@/lib/sns-webhook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // 認証チェック
  if (!authenticateWebhook(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getScheduledContents();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    console.error("[sns/scheduled] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
