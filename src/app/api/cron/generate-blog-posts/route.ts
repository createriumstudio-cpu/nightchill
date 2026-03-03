/**
 * Vercel Cron: SEOブログ記事自動生成
 *
 * 定期実行で2-3都市 × 1-2カテゴリのブログ記事を生成。
 * 記事はdraft状態でDB保存され、管理者が確認後に公開する。
 *
 * CRON_SECRET で認証し、不正アクセスを防止。
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runBlogBatch } from "@/lib/blog-generator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5分（Vercel Pro以上）

export async function GET(request: NextRequest) {
  // ── 認証チェック ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron/generate-blog-posts] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/generate-blog-posts] Starting blog batch...");

  try {
    const result = await runBlogBatch();

    const succeeded = result.results.filter((r) => r.success).length;
    const failed = result.results.filter((r) => !r.success).length;

    console.log(
      `[cron/generate-blog-posts] Complete: ${succeeded} succeeded, ${failed} failed`,
    );

    return NextResponse.json({
      ok: true,
      summary: { succeeded, failed, total: result.results.length },
      results: result.results,
    });
  } catch (error) {
    console.error("[cron/generate-blog-posts] Batch failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
