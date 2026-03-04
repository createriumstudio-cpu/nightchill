/**
 * POST /api/sns/webhook
 *
 * Make/Zapier等の外部サービスから呼び出されるWebhookエンドポイント。
 * SNSコンテンツのステータス更新（予約・公開・失敗）を受け付ける。
 *
 * 認証: Bearer token (環境変数 SNS_WEBHOOK_SECRET)
 */

import { NextResponse } from "next/server";
import {
  authenticateWebhook,
  validateWebhookBody,
  processWebhook,
} from "@/lib/sns-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 認証チェック
  if (!authenticateWebhook(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // バリデーション
  if (!validateWebhookBody(body)) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        expected: {
          contentId: "number (integer)",
          action: ["schedule", "publish", "fail"],
          platform: ["instagram", "x", "tiktok"],
          platformPostId: "string (optional)",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await processWebhook(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.result);
  } catch (error) {
    console.error("[sns/webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
