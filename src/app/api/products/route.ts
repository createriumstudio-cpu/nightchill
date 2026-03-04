import { NextRequest, NextResponse } from "next/server";
import { getActiveProducts, findRecommendedProducts } from "@/lib/products";
import type { Activity, Mood, Budget } from "@/lib/types";

/**
 * GET /api/products — 公開商品一覧 or コンテキストマッチング
 *
 * クエリパラメータ:
 * - occasion: Activity (コンテキストマッチング用)
 * - mood: Mood (コンテキストマッチング用)
 * - budget: Budget (コンテキストマッチング用)
 * - limit: number (レコメンド上限、デフォルト2)
 *
 * パラメータなし → 全公開商品
 * パラメータあり → レコメンデーション
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const occasion = searchParams.get("occasion") as Activity | null;
  const mood = searchParams.get("mood") as Mood | null;
  const budget = searchParams.get("budget") as Budget | null;
  const limit = Number(searchParams.get("limit")) || 2;

  if (occasion && mood && budget) {
    const recommendations = await findRecommendedProducts(
      occasion,
      mood,
      budget,
      limit,
    );
    return NextResponse.json(recommendations);
  }

  const allProducts = await getActiveProducts();
  return NextResponse.json(allProducts);
}
