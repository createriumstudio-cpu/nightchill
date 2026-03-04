import { NextResponse } from "next/server";
import { getFeatureBySlug } from "@/lib/features";
import { convertAndSave } from "@/lib/sns-converter";

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "リクエスト制限に達しました。1分後に再試行してください。" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 },
      );
    }

    // 特集記事を取得
    const article = await getFeatureBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 },
      );
    }

    // SNSコンテンツを生成+保存
    const result = await convertAndSave(article);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("SNS convert error:", error);
    return NextResponse.json(
      { error: "SNSコンテンツの生成に失敗しました" },
      { status: 500 },
    );
  }
}
