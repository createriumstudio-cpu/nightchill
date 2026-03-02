/**
 * Vercel Cron: 週次特集記事自動生成
 *
 * 毎週月曜 0:00 UTC (= 9:00 JST) に実行。
 * CRON_SECRET で認証し、不正アクセスを防止。
 *
 * vercel.json の cron 設定:
 * { "path": "/api/cron/weekly-features", "schedule": "0 0 * * 1" }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runWeeklyBatch } from "@/lib/weekly-feature-generator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5分（Vercel Pro以上）

export async function GET(request: NextRequest) {
  // ── 認証チェック ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron/weekly-features] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/weekly-features] Starting weekly batch...");

  try {
    const result = await runWeeklyBatch();

    const succeeded = result.results.filter((r) => r.success).length;
    const failed = result.results.filter((r) => !r.success).length;

    console.log(
      `[cron/weekly-features] Complete: ${succeeded} succeeded, ${failed} failed`,
    );

    return NextResponse.json({
      ok: true,
      summary: { succeeded, failed, total: result.results.length },
      results: result.results,
    });
  } catch (error) {
    console.error("[cron/weekly-features] Batch failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
